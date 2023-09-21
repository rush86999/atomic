#!/bin/sh
# * Set the default package manager to use if cannot be guessed from lock files
echo "defaultAgent=$PACKAGE_MANAGER" > ~/.nirc


# * Look for the package.json file.
# * If not found, create it in the "functions" directory.
if [ -f "./functions/package.json" ]; then
    # * ./functions/package.json exists
    FUNCTIONS_WORKING_DIR=./functions
    FUNCTIONS_RELATIVE_PATH=.
else
    # * ./functions/package.json DOES NOT exist
    if [ -f "./package.json" ]; then
        # * ./package.json exists
        FUNCTIONS_WORKING_DIR=.
        FUNCTIONS_RELATIVE_PATH=./functions
    else
        # * ./package.json DOES NOT exist"
        mkdir -p functions
        cd functions
        npm init -y 1> /dev/null
        cd ..
        FUNCTIONS_WORKING_DIR=./functions
        FUNCTIONS_RELATIVE_PATH=.
    fi
fi

# * Create a default tsconfig.json file in the functions' working directory.
cp -n $SERVER_PATH/tsconfig.json $FUNCTIONS_WORKING_DIR/tsconfig.json

# * Start nodemon that listens to package.json and lock files and run npm/pnpm/yarn install,
# * Then run another nodemon that listens to the functions directory and run the server
FUNCTIONS_WORKING_DIR=$FUNCTIONS_WORKING_DIR \
FUNCTIONS_RELATIVE_PATH=$FUNCTIONS_RELATIVE_PATH \
nodemon --config $SERVER_PATH/nodemon.json $FUNCTIONS_WORKING_DIR/package.json