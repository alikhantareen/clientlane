# ClientLane

ClientLane is a comprehensive client portal designed to streamline project management and collaboration between freelancers and their clients. It provides a centralized platform for managing projects, sharing updates, and communicating with clients, ensuring that all project-related information is organized and easily accessible.

## Key Features

- **Dashboard**: A centralized dashboard for both freelancers and clients to get a quick overview of their projects, recent activities, and important updates.
- **Client Portals**: Dedicated portals for each client, providing a secure and organized space for project-related information.
- **Project Updates**: A timeline of project updates, allowing freelancers to share progress and clients to stay informed.
- **File Sharing**: A secure file sharing system for exchanging project-related documents, images, and other files.
- **Activity Feed**: A real-time activity feed that tracks all project-related activities, ensuring transparency and accountability.
- **User Authentication**: Secure user authentication with support for magic links, OTP, and password-based login.
- **Subscription Management**: Integration with Stripe for managing subscriptions and handling payments.
- **Notifications**: A notification system to keep users informed about important events, such as new updates, comments, and upcoming deadlines.
- **Shared Links**: A feature for sharing project-related links with clients and other stakeholders.

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Payments**: [Stripe](https://stripe.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Schema Validation**: [Zod](https://zod.dev/)
- **File Storage**: [Vercel Blob](https://vercel.com/docs/storage/blob)
- **Email**: [Resend](https://resend.com/)

## Getting Started

To get started with the project, you need to have Node.js and npm installed on your machine. You can then follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/clinetlane.git
   ```
2. **Install dependencies**:
    ```bash
    npm install
    ```
3. **Set up the database**:
    ```bash
    npx prisma db push
    ```
4. **Seed the database**:
    ```bash
    npx prisma db seed
    ```
5. **Run the development server**:
    ```bash
    npm run dev
    ```

After completing these steps, you should be able to access the application at http://localhost:3000.
