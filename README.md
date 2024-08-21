# 🌐 Culturally-Aware Urban Design Web App

**Google Summer of Code 2024 Project by Sonnet Xu**

## Overview

This project aims to empower communities through culturally-aware urban design and co-creation. Developed during Google Summer of Code 2024 in collaboration with the City of Boston, this open-source web application leverages generative AI to support urban planners in creating more inclusive and culturally sensitive designs.

## Features

- **RESTful API Endpoints:** Developed using Next.js to enable seamless client-server communication.
- **React-Based Frontend:** Integrated with the backend API, providing an intuitive interface for urban planners to interact with the data and AI models.
- **Generative AI Integration:** Utilizes diffusion models to generate urban designs, with the hopes of eventually being able to create designs tailored to the specific needs and histories of different communities.
- **Full-Stack Deployment:** The application is fully deployed using Amazon Web Services (AWS) tools.

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Next.js, Node.js
- **AI Models:** Generative AI diffusion models (Stability)
- **Cloud Services:** AWS
- **Version Control:** GitHub

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OETBoston/ai-for-design
   cd ai-for-design
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the root directory and add your environment variables as shown in the `.env.example` file.

4. Start the development server:

   ```bash
   npm start
   npm run start-react
   ```

5. Access the app:

   Open your browser and navigate to `http://localhost:3000`.

## Usage

**Design Interface:** Explore different urban design options through an intuitive interface. Use the tools provided to interact with the AI models and generate designs.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the project's coding standards and is well-documented.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Acknowledgements

This project was developed as part of the Google Summer of Code 2024, in partnership with the City of Boston. Special thanks to the mentors (Michael Evans and Will Jones) and collaborators who provided guidance and support throughout the development process.