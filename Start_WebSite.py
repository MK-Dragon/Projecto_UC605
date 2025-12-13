import os
import subprocess
from time import sleep


current_dir = os.getcwd()
imposter_dir = "MB_Imposter"
md_dir = "MB_Imposter/MB"
web_site_dir = "web_site"



def start_imposter(file_name: str):
    try:
        command = f'''curl -i -X POST \
        -H "Content-Type: application/json" \
        --data @{file_name} \
        http://localhost:2525/imposters'''

        os.system(command)
    except Exception as e:
        print(f"Error: {file_name} -> {e}")


def start_all_imposters(dir: str):
    print(f"Starting Imposters: '{dir}':")
    
    all_contents = os.listdir(dir)
    all_contents.pop(0) # Remove setup
    all_contents.pop(0) # Remove folder

    for item in all_contents:
        print(f"- {item}")
        start_imposter(dir + "/" + item)


def start_cmd_service(dir: str, command_to_run: str):
    # The full command string for Windows:
    full_command = f'start "New Console" /D "{current_dir}" cmd /k "cd {dir} && {command_to_run}"'

    print(f"Opening new CMD window and running: {command_to_run} in {current_dir}")

    try:
        # Use subprocess.Popen for non-blocking execution (so your Python script doesn't wait)
        subprocess.Popen(
            full_command,
            shell=True,  # Required for using the 'start' command
        )
        # The new console window is now open and running the command.
        print("New console window opened (Python script continues).")

    except Exception as e:
        print(f"Failed to open console: {e}")




def main():
    try:
        start_cmd_service("web_site", 'npm start')
    except Exception as e:
        print(f"Error: {e}")



if __name__ == "__main__":
    main()
