# Project Overview

This is a React Native application built with Expo. The project is named "ctp" and the main entry point is `expo-router/entry`. The application uses file-based routing with Expo Router.

The project is written in TypeScript and uses React for the UI. It also includes several libraries such as `@react-navigation/native`, `expo-font`, `expo-router`, and `react-native-reanimated`.

## Building and Running

To get started with the project, you need to install the dependencies and then run the application.

### Install Dependencies

```bash
npm install
```

### Run the Application

You can run the application on different platforms using the following commands:

*   **To start the development server:**
    ```bash
    npx expo start
    ```

*   **To run on Android:**
    ```bash
    npm run android
    ```

*   **To run on iOS:**
    ```bash
    npm run ios
    ```

*   **To run on the web:**
    ```bash
    npm run web
    ```

## Development Conventions

*   **Linting:** The project uses ESLint for linting the code. You can run the linter with the following command:
    ```bash
    npm run lint
    ```
*   **File-based Routing:** The project uses file-based routing, so all the screens are located in the `app` directory. The routes are automatically generated based on the file structure.
*   **Reset Project:** The project includes a script to reset the project to a fresh start. This script moves the starter code to the `app-example` directory and creates a blank `app` directory. You can run this script with the following command:
    ```bash
    npm run reset-project
    ```
