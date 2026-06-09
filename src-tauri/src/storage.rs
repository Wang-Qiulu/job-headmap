// Local file storage with atomic write + rotating backups.
//
// Layout under app_data_dir() (macOS: ~/Library/Application Support/<identifier>/):
//
//   data.json                          - canonical store
//   backups/data-YYYYMMDD-HHMMSS.json  - snapshot per save, keep newest 7
//
// Atomic write: write to data.json.tmp -> fsync -> rename -> POSIX-atomic swap.
// All commands return Result<_, String> so the frontend always gets a serializable error.

use std::{fs, io::Write, path::PathBuf};
use tauri::{AppHandle, Manager};

const BACKUP_RETENTION: usize = 7;
const DATA_FILE: &str = "data.json";
const TMP_FILE: &str = "data.json.tmp";
const BACKUP_DIR: &str = "backups";

fn app_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| format!("create app dir: {e}"))?;
    Ok(dir)
}

/// Returns the absolute path of the app data directory so the frontend can show
/// it to the user (e.g. on a future "open data folder" button).
#[tauri::command]
pub async fn data_dir(app: AppHandle) -> Result<String, String> {
    Ok(app_dir(&app)?.to_string_lossy().into_owned())
}

/// Reads data.json. Returns Ok(None) when the file does not exist yet (first launch).
#[tauri::command]
pub async fn load_data(app: AppHandle) -> Result<Option<String>, String> {
    let path = app_dir(&app)?.join(DATA_FILE);
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(&path)
        .map(Some)
        .map_err(|e| format!("read {DATA_FILE}: {e}"))
}

/// Writes data.json atomically and appends a timestamped backup, pruning to BACKUP_RETENTION.
///
/// Steps:
///   1. write to data.json.tmp + fsync
///   2. fs::rename(tmp, data.json)  // POSIX atomic on same filesystem
///   3. copy data.json -> backups/data-{ts}.json
///   4. prune oldest backups beyond BACKUP_RETENTION
#[tauri::command]
pub async fn save_data(app: AppHandle, json: String) -> Result<(), String> {
    let dir = app_dir(&app)?;
    let data_path = dir.join(DATA_FILE);
    let tmp_path = dir.join(TMP_FILE);
    let backup_dir = dir.join(BACKUP_DIR);
    fs::create_dir_all(&backup_dir).map_err(|e| format!("create backups/: {e}"))?;

    // 1. write tmp + fsync (scoped so the file handle drops before rename)
    {
        let mut f = fs::OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp_path)
            .map_err(|e| format!("open tmp: {e}"))?;
        f.write_all(json.as_bytes())
            .map_err(|e| format!("write tmp: {e}"))?;
        f.sync_all().map_err(|e| format!("fsync tmp: {e}"))?;
    }

    // 2. atomic rename
    fs::rename(&tmp_path, &data_path).map_err(|e| format!("rename: {e}"))?;

    // 3. snapshot to backups/
    let ts = chrono::Local::now().format("%Y%m%d-%H%M%S%.3f").to_string();
    let backup_path = backup_dir.join(format!("data-{ts}.json"));
    fs::copy(&data_path, &backup_path).map_err(|e| format!("copy backup: {e}"))?;

    // 4. prune old backups (keep newest BACKUP_RETENTION)
    prune_backups(&backup_dir)?;

    Ok(())
}

fn prune_backups(backup_dir: &PathBuf) -> Result<(), String> {
    let mut entries: Vec<_> = fs::read_dir(backup_dir)
        .map_err(|e| format!("read backups/: {e}"))?
        .filter_map(Result::ok)
        .filter(|e| {
            e.file_name()
                .to_string_lossy()
                .starts_with("data-")
        })
        .collect();
    // sort ascending by modified time -> oldest first
    entries.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());
    while entries.len() > BACKUP_RETENTION {
        let old = entries.remove(0);
        let _ = fs::remove_file(old.path());
    }
    Ok(())
}
