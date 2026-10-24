import PageHeader from "../layout/PageHeader";
import { Link } from "../router";

export default function NotFoundPage() {
  return (
    <PageHeader kicker="404" title="Halaman tidak ditemukan">
      <p>Alamat yang kamu buka tidak ada di AyoDonor.</p>
      <p>
        <Link to="/" className="btn">
          Ke beranda
        </Link>
      </p>
    </PageHeader>
  );
}
