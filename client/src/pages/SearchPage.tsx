import { Search } from "../components/Search";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Search Articles</h1>
        <Search />
      </div>
    </div>
  );
}
