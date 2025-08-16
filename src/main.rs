
use core::format_args;
use core::time::Duration;
use std::fs;
use std::process::exit;
use std::process::Command;

use clap::{Parser, Subcommand};

use cmd_lib::run_cmd;
use cmd_lib::run_fun;
use anyhow::Context;
use reqwest::blocking::Client;
use serde::Serialize;
use std::env;


#[derive(Parser)]
#[command(name = "c2", version, about = "The System C2 CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Append to the action list
    #[command(alias = "aal")]
    AppendActionList,
}

#[derive(Serialize)]
struct Todo {
    text: String,
    #[serde(rename = "type")]
    task_type: String,
}


fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::AppendActionList => {
            if let Err(err) = cmd_append_action_list() {
                println!("err: {}", err);
                exit(1);
            }
        }
    }
}

pub fn parse_str_to_list(list_str: String) -> anyhow::Result<Vec<String>> {
    let mut task_list = Vec::new();
    for line in list_str.lines() {
        if line == "" {
            continue;
        }

        //let task = (&line[2..]).to_owned();
        let task = line.to_owned();
        task_list.push(task);
    }

    return Ok(task_list);
}

pub fn cmd_append_action_list() -> anyhow::Result<()> {

    let mut task_ids: Vec<String> = Vec::new();

    // get task list by editing a md file with nvim
    let tmp_file = run_fun!(mktemp).context("could not run mktemp")?;
    Command::new("nvim")
        .arg(&tmp_file)
        .status()
        .context("failed to run nvim")?;

    let list_str = fs::read_to_string(tmp_file.as_str())?;

    let tasks = parse_str_to_list(list_str)?;


    // Load credentials from env variables
    let home_dir = std::env::home_dir().ok_or(anyhow::Error::msg("could not get home_dir"))?;
    let user_id = fs::read_to_string(home_dir.join("secrets").join("habitica-user-id"))?;
    let api_token = fs::read_to_string(home_dir.join("secrets").join("habitica-api-token"))?;


    // add the tasks to habitica
    let client = Client::new();

    for todo_text in tasks {
        let todo = Todo {
            text: todo_text.clone(),
            task_type: "todo".into(),
        };

        let res = client
            .post("https://habitica.com/api/v3/tasks/user")
            .header("x-api-user", &user_id)
            .header("x-api-key", &api_token)
            .header("x-client", format!("{}-SystemC2", user_id))
            .json(&todo)
            .send()?;

        if !res.status().is_success() {
            eprintln!("Failed to add '{}': {}", todo_text, res.text()?);
        } else {
            let data = res.json::<serde_json::Value>()?;
            let id = data["data"]["id"].clone().as_str().ok_or(anyhow::Error::msg(""))?.to_owned();
            println!("Added to-do: '{}' with id '{}'", todo_text, id);
            task_ids.push(id);
        }

    }

    for task_id in task_ids {
        let move_url = format!("https://habitica.com/api/v3/tasks/{}/move/to/-1", task_id);
        let move_res = client
            .post(&move_url)
            .header("x-api-user", &user_id)
            .header("x-api-key", &api_token)
            .header("x-client", format!("{}-SystemC2", user_id))
            .send()?;

        if !move_res.status().is_success() {
            eprintln!("Failed to move task to bottom: {}", move_res.text()?);
        }
    }

    Ok(())
}



