import { Navbar } from "@/components/Navbar";
import GoongMap from "@/components/GoongMap";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <Navbar />

      <main className="min-h-[calc(100vh-76px)] bg-white">
        <section className="relative bg-white">
          <div className="mx-auto w-full">
            <div className="relative h-[calc(100vh-76px)] overflow-hidden bg-white">
              <GoongMap />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;