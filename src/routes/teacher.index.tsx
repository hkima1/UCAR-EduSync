import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/")({
  component: TeacherIndexRedirect,
});

function TeacherIndexRedirect() {
  return <Navigate to="/teacher/dashboard" />;
}
