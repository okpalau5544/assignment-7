# My Actions Project

This project demonstrates how to build and publish Docker images using GitHub Actions. It includes a simple TypeScript application that can be containerized and deployed.

## Project Structure

```
my-actions-project
├── .github
│   └── workflows
│       └── build-and-publish.yml  # GitHub Actions workflow for building and publishing Docker images
├── src
│   ├── index.ts                     # Main entry point of the application
│   └── types
│       └── index.ts                 # Type definitions for the application
├── Dockerfile                        # Instructions for building the Docker image
├── package.json                     # npm configuration file
├── tsconfig.json                    # TypeScript configuration file
└── README.md                        # Project documentation
```

## Getting Started

To get started with this project, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd my-actions-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the Docker image**:
   You can build the Docker image locally using the following command:
   ```bash
   docker build -t my-actions-project .
   ```

4. **Run the Docker container**:
   After building the image, you can run it with:
   ```bash
   docker run -p 3000:3000 my-actions-project
   ```

## Usage

Once the application is running, you can access it at `http://localhost:3000`.

## GitHub Actions

This project includes a GitHub Actions workflow defined in `.github/workflows/build-and-publish.yml`. This workflow automates the process of building the Docker image and publishing it to GitHub's image registry whenever changes are pushed to the repository.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.