import Image from 'next/image'

const TIMELINE = [
  { year: '1891', event: 'Born in Mhow, Madhya Pradesh, into a family from the Mahar caste — classified as "untouchable" by the caste system.' },
  { year: '1913', event: 'Awarded a scholarship to Columbia University, New York — one of the first Dalits to study abroad.' },
  { year: '1916–1923', event: 'Earned a Ph.D. from Columbia University and a D.Sc. from the London School of Economics. Also qualified as a barrister from Gray\'s Inn, London.' },
  { year: '1924', event: 'Founded Bahishkrit Hitkarini Sabha to promote education and socio-economic improvement among untouchables.' },
  { year: '1927', event: 'Led the Mahad Satyagraha — a landmark protest asserting the right of untouchables to draw water from a public tank.' },
  { year: '1932', event: 'Signed the Poona Pact with Mahatma Gandhi, securing reserved seats in legislatures for Depressed Classes.' },
  { year: '1947', event: 'Appointed India\'s first Law Minister after independence.' },
  { year: '1947–1950', event: 'Chaired the Drafting Committee of India\'s Constitution, producing one of the most progressive democratic constitutions in the world.' },
  { year: 'Oct 14, 1956', event: 'Embraced Buddhism at Deekshabhoomi, Nagpur, alongside an estimated 400,000–600,000 followers — the largest mass conversion in modern history.' },
  { year: 'Dec 6, 1956', event: 'Passed away in New Delhi. December 6 is observed as Mahaparinirvan Diwas.' },
]

export default function AmbedkarPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative py-28 md:py-36 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Bodhisattva of Modern India</p>
          <div className="flex justify-center mb-8">
            <div className="w-44 h-56 md:w-52 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <Image
                src="/images/ambedkar-portrait.jpg"
                alt="Dr. B.R. Ambedkar"
                width={208}
                height={256}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-poppins">Dr. Babasaheb Ambedkar</h1>
          <p className="text-lg md:text-xl text-white/80 mb-2">(1891 – 1956)</p>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Scholar. Jurist. Social Reformer. Father of the Indian Constitution. Reviver of Buddhism in India.
          </p>
        </div>
      </section>

      {/* Against All Odds */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest">Early Life</p>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
            Against All Odds: From Untouchability to the World&apos;s Finest Universities
          </h2>
          <div className="space-y-4 text-text-medium leading-relaxed text-base md:text-lg">
            <p>
              Bhimrao Ramji Ambedkar was born on April 14, 1891, in Mhow (now in Madhya Pradesh, India), into a family classified as &quot;untouchable&quot; — the lowest stratum of the Hindu caste hierarchy. From childhood, he faced dehumanising discrimination: he was made to sit apart from other students, denied water from common sources, and humiliated in ways that would have broken most spirits.
            </p>
            <p>
              Yet he refused to accept these circumstances as his destiny. With extraordinary determination and the support of progressive patrons, he earned a scholarship to Columbia University in New York in 1913. Under the mentorship of the renowned philosopher John Dewey, he completed his M.A. and then his Ph.D. He went on to the London School of Economics, earning a D.Sc. in economics — one of the most rigorous academic distinctions of the era. He also qualified as a barrister from Gray&apos;s Inn, London.
            </p>
            <p>
              He became one of the most educated men in all of India, and one of the most educated Dalit figures in history — a living repudiation of the lie that untouchables were intellectually inferior.
            </p>
          </div>
          <blockquote className="border-l-4 border-primary-saffron pl-6 py-2">
            <p className="text-xl md:text-2xl font-bold text-primary-blue italic">&quot;Educate, Agitate, Organise.&quot;</p>
            <cite className="text-text-medium text-sm mt-2 block">— Dr. B.R. Ambedkar</cite>
          </blockquote>
        </div>
      </section>

      {/* Struggle for the Oppressed */}
      <section className="py-20 md:py-28 bg-background-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest">Social Justice</p>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
            A Lifetime of Struggle for the Oppressed
          </h2>
          <div className="space-y-4 text-text-medium leading-relaxed text-base md:text-lg">
            <p>
              Returning to India armed with education and legal acumen, Dr. Ambedkar devoted his life to dismantling the caste system. He founded organisations, published newspapers, and led mass movements to assert the rights of Dalits.
            </p>
            <p>
              In 1927, he led the Mahad Satyagraha — a peaceful protest at Mahad in Maharashtra where Dalits publicly drew water from a public tank, an act that was taboo under caste norms. He then burned a copy of Manusmriti, the ancient text considered the cornerstone of caste hierarchy — a symbolic act of defiance that resonated across generations.
            </p>
            <p>
              In 1932, the British announced separate electorates for Depressed Classes as part of the Communal Award. Mahatma Gandhi fasted in opposition. After intense negotiations, Dr. Ambedkar signed the Poona Pact with Gandhi — reserving legislative seats for Dalits within the general Hindu electorate. The pact was a difficult compromise, but it secured formal political representation for millions.
            </p>
            <p>
              Throughout, Dr. Ambedkar never relented on his core conviction: that political rights alone were not enough — social and economic equality were inseparable from political freedom.
            </p>
          </div>
        </div>
      </section>

      {/* Father of the Constitution */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest">National Legacy</p>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
            Father of the Indian Constitution
          </h2>
          <div className="space-y-4 text-text-medium leading-relaxed text-base md:text-lg">
            <p>
              When India gained independence in 1947, Prime Minister Jawaharlal Nehru appointed Dr. Ambedkar as India&apos;s first Law Minister. More significantly, he was elected Chairman of the Constitution Drafting Committee — the body entrusted with writing the fundamental law of the new republic.
            </p>
            <p>
              The Constitution of India, adopted in 1950, is widely regarded as one of the most progressive constitutions in the world. Dr. Ambedkar ensured it enshrined fundamental rights for all citizens regardless of caste, creed, or gender. It abolished untouchability as a legal category, guaranteed equality before the law, and introduced affirmative action provisions for Scheduled Castes and Scheduled Tribes.
            </p>
            <p>
              In a single document, he encoded into law the principles he had fought for his entire life — dignity, equality, and justice for every Indian.
            </p>
          </div>
        </div>
      </section>

      {/* The Great Conversion */}
      <section
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2f6e 0%, #4a1f7a 55%, #7a2010 100%)' }}
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest">October 14, 1956</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white font-poppins">
            The Great Conversion: A New Path for Millions
          </h2>
          <div className="space-y-4 text-white/90 leading-relaxed text-base md:text-lg">
            <p>
              After decades of studying world religions and reflecting on which path offered genuine liberation, Dr. Ambedkar concluded that Buddhism — as he understood and articulated it — was the only faith fully consistent with liberty, equality, and fraternity.
            </p>
            <p>
              On October 14, 1956, at Deekshabhoomi in Nagpur, Dr. Ambedkar took the three refuges and five precepts from the Theravada monk Bhadant U Chandramani, and then administered the vows to an estimated 400,000 to 600,000 followers in one of the largest and most peaceful mass conversions in recorded history.
            </p>
            <p>
              He called this path <strong>Navayana</strong> — the New Vehicle — distinguishing it from Theravada, Mahayana, and Vajrayana. His interpretation was grounded in reason, ethics, and social transformation, and he articulated it in his final and most profound work, <em>The Buddha and His Dhamma</em>, completed just days before his death on December 6, 1956.
            </p>
          </div>
          <blockquote className="border-l-4 border-primary-saffron pl-6 py-2">
            <p className="text-xl md:text-2xl font-bold text-white italic">
              &quot;I like the religion that teaches liberty, equality, and fraternity.&quot;
            </p>
            <cite className="text-white/70 text-sm mt-2 block">— Dr. B.R. Ambedkar</cite>
          </blockquote>
        </div>
      </section>

      {/* Why Ambedkar Matters in Canada */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest">Our Connection</p>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
            Why Ambedkar Matters — Especially Here in Canada
          </h2>
          <div className="space-y-4 text-text-medium leading-relaxed text-base md:text-lg">
            <p>
              The Ambedkarite Buddhist families now living in Canada are here, in large part, because of Dr. Ambedkar. His relentless emphasis on education — &quot;Cultivate your mind&quot; — gave generations of Dalits and Buddhists the tools to rise within a society that had sought to keep them down.
            </p>
            <p>
              Many of us or our parents were the first in our families to attend university, earn professional degrees, and build careers. That journey eventually led many to immigrate — to Canada, to Ontario — building new lives while carrying the Dhamma in our hearts.
            </p>
            <p>
              ABCC was founded to ensure that this heritage is not lost in the diaspora. We gather to practise the Dhamma Dr. Ambedkar described, to celebrate the dates that mark his life and his legacy, and to ensure that the next generation born in Canada knows who Dr. Ambedkar was and what he sacrificed.
            </p>
            <p className="font-medium text-text-dark">
              His work is not finished. As long as caste discrimination exists anywhere — including here in Canada — his mission continues. We carry it forward.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 md:py-28 bg-background-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">His Journey</p>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              A Life in Milestones
            </h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-blue to-accent-purple" />
            <div className="space-y-8">
              {TIMELINE.map((item) => (
                <div key={item.year} className="flex gap-6 pl-16 relative">
                  {/* Dot */}
                  <div className="absolute left-[18px] top-1.5 w-4 h-4 rounded-full bg-primary-blue border-2 border-white shadow" />
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-background-light flex-1">
                    <p className="text-sm font-bold text-primary-saffron mb-1">{item.year}</p>
                    <p className="text-text-medium leading-relaxed text-sm">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
