# Brainshare

Brainshare is a dynamic social platform where users can share posts, engage with others through comments, and upvote or downvote posts. The platform also includes an admin panel for managing users and reported comments, and offers a premium membership feature powered by Stripe payment integration.

## Live URL

Access the live application here: [Brainshare Live URL](https://brainshare-a-12.web.app/)

## Purpose

Brainshare aims to provide a collaborative environment where users can exchange ideas, interact with engaging content, and connect with like-minded individuals. The platform incorporates features for premium users, offering enhanced functionality and a unique experience.

## Key Features

### User Features:

- **Create Posts**: Users can create and share their posts with the community.
- **Engage with Posts**: Users can comment, upvote, or downvote posts.
- **Manage Posts**: Users can edit or delete their posts and view all their comments.

### Admin Features:

- **User Management**: Admins can manage users and assign admin roles.
- **Moderate Content**: Admins can delete any reported comments or posts.

### Premium Membership:

- **Gold Badge Membership**: Users can opt for premium membership by completing a Stripe-powered payment process to unlock exclusive features.

### Additional Functionalities:

- **Search and Sort**: Search posts by tags and sort by popularity or recency.
- **Pagination**: Optimized post loading using pagination.

## Technologies Used

### Frontend:

- **React**: For building the user interface.
- **React Router DOM**: For handling routing.
- **Axios**: For making API requests.
- **Firebase**: For authentication.
- **Tailwind CSS**: For styling the application.
- **React Query**: For efficient data fetching and caching.
- **Stripe.js and @stripe/react-stripe-js**: For integrating Stripe payment gateway.
- **Lottie-React**: For animations.
- **React Icons**: For incorporating icons.
- **Recharts**: For data visualization.
- **React-Hot-Toast**: For notifications.
- **React-Select**: For customizable dropdowns.
- **React-Awesome-Button**: For enhanced button styles.
- **Date-FNS**: For handling dates and times.
- **React-Share**: For social sharing features.

### Backend:

- **Express.js**: Backend framework.
- **MongoDB**: Database for storing posts, users, and other data.
- **JWT (JSON Web Tokens)**: For secure authentication.
- **Stripe**: For handling payment processing.
- **Morgan**: For logging HTTP requests.
- **Dotenv**: For managing environment variables.
- **Cookie-Parser**: For parsing cookies.
- **CORS**: For handling cross-origin resource sharing.

## Installation Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/ranak8811/BrainShare-Client.git
   ```

2. Navigate to the project directory and install dependencies:

   ```bash
   cd brainshare/frontend
   npm install

   cd ../backend
   npm install
   ```

3. Set up environment variables:

   - Create a `.env` file in the backend directory.
   - Add the following variables:
     ```env
     PORT=4000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
     ```

4. Start the application:

   - Backend:
     ```bash
     npm start
     ```
   - Frontend:
     ```bash
     npm start
     ```

5. Open your browser and navigate to `http://localhost:4000`.

---

## Backend Repository

Backend code link: https://github.com/ranak8811/BrainShare-Server

## Contribution

Contributions are welcome! Feel free to fork the repository and submit pull requests.

---

Thank you for visiting Brainshare. Join the community and start sharing your ideas today!
