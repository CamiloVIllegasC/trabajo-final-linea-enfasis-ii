import { RouterProvider } from "react-router";
import { router } from "./routes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{classNames: {error: "bg-red-500 text-white"}}} />
    </AuthProvider>
  );
}