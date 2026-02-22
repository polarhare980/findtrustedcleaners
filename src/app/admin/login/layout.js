// Override the parent admin layout so /admin/login is NOT protected
export default function LoginLayout({ children }) {
  return children;
}