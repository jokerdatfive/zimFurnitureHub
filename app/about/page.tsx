import Image from "next/image";

export default function OurStory() {
  return (
    <div className="pt-24 pb-16 bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero-furniture.jpg"
          alt="Craftsmanship"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6">
            Our Story
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            From a small workshop in Harare to a hub of modern Zimbabwean craftsmanship.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-24 px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold mb-6">The Beginning</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Kombera Kombera Furnitures started with a simple vision: to bring the rich heritage of Zimbabwean woodworking into the modern home. Founded in 2020, we set out to prove that local craftsmanship could stand side-by-side with international luxury.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-semibold mb-6">Our Philosophy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe that furniture is more than just utility; it&apos;s an expression of soul. Every piece we create is a balance of minimalist design and high-quality materials, sourced ethically from across the region.
              </p>
            </div>
            <div className="relative aspect-square rounded-sm overflow-hidden bg-muted">
              <Image
                src="/images/collection-sofas.jpg"
                alt="Our workshop"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="text-center pt-12">
            <h2 className="font-serif text-3xl font-semibold mb-6">Sustainability</h2>
            <p className="text-lg text-muted-foreground leading-relaxed italic">
              &quot;We don&apos;t just build for today; we build for generations. Our commitment to sustainable forestry and local empowerment is at the heart of everything we do.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-primary font-serif text-xl">01</span>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-4">Artisan Crafted</h3>
              <p className="text-muted-foreground text-sm">
                Each piece is touched by human hands, ensuring a level of detail that machines simply can&apos;t replicate.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-primary font-serif text-xl">02</span>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-4">Timeless Design</h3>
              <p className="text-muted-foreground text-sm">
                We eschew temporary trends in favor of a minimalist aesthetic that remains elegant decade after decade.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-primary font-serif text-xl">03</span>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-4">Ethical Sourcing</h3>
              <p className="text-muted-foreground text-sm">
                From our timber to our textiles, we know exactly where our materials come from and who made them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Locations Section */}
      <section className="py-20 bg-background border-t border-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-3">Visit Our Showrooms</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-10">
            Experience our handcrafted furniture pieces in person, inspect wood finishes, and discuss custom bespoke orders.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">Main Showroom & Workshop</span>
              <h3 className="font-serif text-xl font-bold text-foreground">Harare Highglen Hub</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                10670 Harare Highglen Road<br />
                (10 kilometres from Highglen)<br />
                Harare, Zimbabwe
              </p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">Open Mon – Sat (8am – 5pm)</span>
                <a href="https://wa.me/263770000000" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Chat via WhatsApp →
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">Regional Branch</span>
              <h3 className="font-serif text-xl font-bold text-foreground">Chiredzi Branch</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Chiredzi Regional Showroom & Depot<br />
                Serving Lowveld & Masvingo Province<br />
                Zimbabwe
              </p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">Open Mon – Sat (8am – 5pm)</span>
                <a href="https://wa.me/263770000000" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Inquire Branch Stock →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
