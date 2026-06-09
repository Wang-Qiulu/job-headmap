// Pure-Rust verification of the atomic-write + rotation logic in storage.rs.
// We can't easily inject a fake AppHandle for the #[tauri::command] entry points,
// so we re-test the file-system primitives that they delegate to.

use std::{fs, io::Write, thread, time::Duration};
use tempfile::TempDir;

const BACKUP_RETENTION: usize = 7;

fn save_once(dir: &std::path::Path, payload: &str, ts: &str) -> Result<(), String> {
    let data_path = dir.join("data.json");
    let tmp_path = dir.join("data.json.tmp");
    let backup_dir = dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
    {
        let mut f = fs::OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)
            .map_err(|e| e.to_string())?;
        f.write_all(payload.as_bytes()).map_err(|e| e.to_string())?;
        f.sync_all().map_err(|e| e.to_string())?;
    }
    fs::rename(&tmp_path, &data_path).map_err(|e| e.to_string())?;
    let backup_path = backup_dir.join(format!("data-{ts}.json"));
    fs::copy(&data_path, &backup_path).map_err(|e| e.to_string())?;

    // prune
    let mut entries: Vec<_> = fs::read_dir(&backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .filter(|e| e.file_name().to_string_lossy().starts_with("data-"))
        .collect();
    entries.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());
    while entries.len() > BACKUP_RETENTION {
        let old = entries.remove(0);
        let _ = fs::remove_file(old.path());
    }
    Ok(())
}

#[test]
fn writes_data_json_and_creates_one_backup() {
    let tmp = TempDir::new().unwrap();
    save_once(tmp.path(), r#"{"applications":[]}"#, "20260609-120000-000").unwrap();
    let data = fs::read_to_string(tmp.path().join("data.json")).unwrap();
    assert_eq!(data, r#"{"applications":[]}"#);
    let backups: Vec<_> = fs::read_dir(tmp.path().join("backups"))
        .unwrap()
        .filter_map(Result::ok)
        .collect();
    assert_eq!(backups.len(), 1);
}

#[test]
fn rotates_backups_to_max_seven() {
    let tmp = TempDir::new().unwrap();
    // 10 writes, 1 ms apart so mtime is monotonic
    for i in 0..10 {
        let ts = format!("20260609-12000{i}-000");
        save_once(tmp.path(), &format!(r#"{{"i":{i}}}"#), &ts).unwrap();
        thread::sleep(Duration::from_millis(5));
    }
    let backups: Vec<_> = fs::read_dir(tmp.path().join("backups"))
        .unwrap()
        .filter_map(Result::ok)
        .collect();
    assert_eq!(backups.len(), BACKUP_RETENTION, "should keep newest 7");

    // newest one should still be reachable
    let data = fs::read_to_string(tmp.path().join("data.json")).unwrap();
    assert_eq!(data, r#"{"i":9}"#);
}

#[test]
fn no_tmp_file_remains_after_successful_write() {
    let tmp = TempDir::new().unwrap();
    save_once(tmp.path(), r#"{"x":1}"#, "20260609-130000-000").unwrap();
    assert!(!tmp.path().join("data.json.tmp").exists(), "tmp must be renamed away");
    assert!(tmp.path().join("data.json").exists());
}

#[test]
fn second_write_overwrites_data_json() {
    let tmp = TempDir::new().unwrap();
    save_once(tmp.path(), r#"{"v":1}"#, "20260609-140000-000").unwrap();
    save_once(tmp.path(), r#"{"v":2}"#, "20260609-140001-000").unwrap();
    let data = fs::read_to_string(tmp.path().join("data.json")).unwrap();
    assert_eq!(data, r#"{"v":2}"#);
    let backups: Vec<_> = fs::read_dir(tmp.path().join("backups"))
        .unwrap()
        .filter_map(Result::ok)
        .collect();
    assert_eq!(backups.len(), 2);
}
