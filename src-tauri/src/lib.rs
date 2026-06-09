// Tauri 2 entry. Registers the storage commands defined in storage.rs.

mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            storage::load_data,
            storage::save_data,
            storage::data_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
