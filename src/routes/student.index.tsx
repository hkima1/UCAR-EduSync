import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/student/")({
  component: StudentIndexRedirect,
});

function StudentIndexRedirect() {
  return <Navigate to="/student/dashboard" />;
}
