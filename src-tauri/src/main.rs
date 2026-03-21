// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

const SERVER_PORT: u16 = 4173;
const SERVER_URL: &str = "http://localhost:4173";
const POLL_INTERVAL: Duration = Duration::from_millis(300);
const MAX_WAIT: Duration = Duration::from_secs(30);

/// Kill any process currently listening on the given port.
fn kill_port(port: u16) {
    let output = Command::new("lsof")
        .args(["-ti", &format!(":{}", port)])
        .output();

    if let Ok(output) = output {
        let pids = String::from_utf8_lossy(&output.stdout);
        for pid in pids.split_whitespace() {
            if let Ok(pid_num) = pid.parse::<i32>() {
                unsafe {
                    libc::kill(pid_num, libc::SIGTERM);
                }
            }
        }
        // Brief pause to let processes exit
        std::thread::sleep(Duration::from_millis(500));
    }
}

/// Poll the server until it accepts TCP connections.
fn wait_for_ready() -> bool {
    let start = std::time::Instant::now();

    while start.elapsed() < MAX_WAIT {
        match std::net::TcpStream::connect(format!("localhost:{}", SERVER_PORT)) {
            Ok(_) => return true,
            Err(_) => std::thread::sleep(POLL_INTERVAL),
        }
    }

    false
}

fn main() {
    let sidecar_pid: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(None));
    let sidecar_pid_clone = sidecar_pid.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            let window = app.get_webview_window("main").expect("main window not found");
            let app_handle = app.handle().clone();

            // Kill any stale process on the port
            kill_port(SERVER_PORT);

            // Spawn the sidecar in a background thread
            let pid_ref = sidecar_pid_clone.clone();
            std::thread::spawn(move || {
                let shell = app_handle.shell();

                // Run: node node_modules/.bin/astro preview --port 4173
                let result = shell
                    .sidecar("node")
                    .expect("failed to create sidecar command")
                    .args([
                        "node_modules/.bin/astro",
                        "preview",
                        "--port",
                        &SERVER_PORT.to_string(),
                    ])
                    .spawn();

                match result {
                    Ok((mut _rx, child)) => {
                        let child_pid = child.pid();
                        if let Ok(mut pid) = pid_ref.lock() {
                            *pid = Some(child_pid);
                        }

                        // Wait for the server to become ready
                        if wait_for_ready() {
                            let _ = window.eval(&format!(
                                "window.location.replace('{}')",
                                SERVER_URL
                            ));
                        } else {
                            let _ = window.eval(
                                "document.body.innerHTML = \
                                '<div style=\"text-align:center;padding:2rem;color:#f38ba8\">\
                                <p>Failed to start the server.</p>\
                                <p>Please restart the app.</p></div>'"
                            );
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to spawn sidecar: {}", e);
                        let _ = window.eval(
                            "document.body.innerHTML = \
                            '<div style=\"text-align:center;padding:2rem;color:#f38ba8\">\
                            <p>Failed to start Node.js sidecar.</p></div>'"
                        );
                    }
                }
            });

            Ok(())
        })
        .on_window_event(move |_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Kill the sidecar process group on window close
                if let Ok(pid) = sidecar_pid.lock() {
                    if let Some(child_pid) = *pid {
                        // Use positive PID to avoid process group issues and u32→i32 overflow
                        if child_pid <= i32::MAX as u32 {
                            unsafe {
                                libc::kill(child_pid as i32, libc::SIGTERM);
                            }
                        }
                    }
                }
                // Also kill anything left on the port
                kill_port(SERVER_PORT);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
