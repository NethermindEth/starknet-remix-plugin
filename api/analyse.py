import os
# get number of folders under upload/temp directory
def get_num_of_folders():
    path = 'upload/temp'
    num_of_folders = len(os.listdir(path))
    return num_of_folders

# get number of .cairo files under upload/temp directory recursively
def get_num_of_files():
    path = 'upload/temp'
    num_of_files = 0
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".cairo"):
                num_of_files += 1
    return num_of_files

# count ` /compile-scarb/` in the backend.log file
def get_num_of_compiles():
    path = 'backend.log'
    num_of_compiles = 0
    with open(path, 'r') as f:
        for line in f:
            if '/compile-scarb/' in line:
                num_of_compiles += 1
    return num_of_compiles

print("users", get_num_of_folders())
print("cairo files", get_num_of_files())
print("compiles", get_num_of_compiles())
