import Link from "next/link";
import {
  GENRE_THEMES,
  type GenreBook,
  type GenreId,
  type GenreThemeConfig,
} from "@/lib/genres-data";
import Image from "next/image";
import MotionEffects from "@/components/MotionEffects";
import FamilyNav from "@/components/FamilyNav";
import BookShelves from "@/components/BookShelves";
import CurrentYear from "@/components/CurrentYear";

export const genreOrder: GenreId[] = [
  "crime",
  "classics",
  "wuxia",
  "romance",
  "manga",
];

export function GenreNav({ active }: { active?: GenreId | "blog" | "about" }) {
  return <FamilyNav active={active} />;
}

function BookCover({
  book,
  genre,
  large = false,
}: {
  book: GenreBook;
  genre: GenreId;
  large?: boolean;
}) {
  return (
    <div
      className={`book-cover cover-${genre} ${large ? "book-cover-large" : ""}`}
      aria-label={`${book.coverUrl ? "ภาพปก" : "ภาพปกจำลอง"}ของ ${book.title}`}
      role="img"
    >
      {book.coverUrl ? (
        <Image
          src={book.coverUrl}
          alt=""
          fill
          sizes={large ? "230px" : "142px"}
          className="book-cover-photo"
        />
      ) : (
        <>
          <span className="cover-top">FAMILY JS SELECTED / {book.code}</span>
          <span className="cover-symbol" aria-hidden="true">
            {genre === "crime"
              ? "✳"
              : genre === "classics"
                ? "❦"
                : genre === "wuxia"
                  ? "山"
                  : genre === "romance"
                    ? "♡"
                    : "★"}
          </span>
          <span className="cover-title">{book.title}</span>
          <span className="cover-author">{book.author}</span>
        </>
      )}
    </div>
  );
}

function Rating({ book }: { book: GenreBook }) {
  if (book.rating === null || book.rating === undefined) {
    return (
      <span
        className="book-rating book-rating-unread"
        aria-label="ยังไม่ได้อ่าน"
      >
        ยังไม่ได้อ่าน
      </span>
    );
  }
  return (
    <span
      className="book-rating"
      aria-label={`คะแนน ${book.rating.toFixed(1)} จาก 5`}
    >
      ★ {book.rating.toFixed(1)} <small>/ 5</small>
    </span>
  );
}

function BookDetails({ book, genre }: { book: GenreBook; genre: GenreId }) {
  return (
    <details className="book-details" id={book.id}>
      <summary>อ่านเรื่องย่อและความเห็น</summary>
      <div className="book-details-body">
        <p>{book.synopsis}</p>
        {book.highlightQuote && (
          <blockquote>“{book.highlightQuote}”</blockquote>
        )}
        {book.detailHtml && (
          <div
            className="rich-prose book-detail-rich"
            dangerouslySetInnerHTML={{ __html: book.detailHtml }}
          />
        )}
        <div className="book-tags">
          {book.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="book-detail-meta">
          {[
            book.pages ? `${book.pages} หน้า` : null,
            book.publisher,
            GENRE_THEMES[genre].englishName,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </details>
  );
}

function Metrics({ genre }: { genre: GenreThemeConfig }) {
  const book = genre.spotlightBook;
  const values = [
    book.metrics.m1,
    book.metrics.m2,
    book.metrics.m3,
    book.metrics.m4,
  ];
  if (values.every((value) => value === 0)) return null;
  return (
    <div className="genre-metrics" aria-label="คะแนนด้านต่าง ๆ ของหนังสือเด่น">
      {genre.metricNames.map((name, index) => (
        <div className="metric" key={name}>
          <div>
            <span>{name}</span>
            <strong>{values[index]}/5</strong>
          </div>
          <div className="metric-track">
            <span style={{ width: `${values[index] * 20}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHead({
  overline,
  title,
  aside,
}: {
  overline: string;
  title: string;
  aside?: string;
}) {
  return (
    <div className="genre-section-head">
      <div>
        <p className="eyebrow">{overline}</p>
        <h2>{title}</h2>
      </div>
      {aside && <span>{aside}</span>}
    </div>
  );
}

function CrimePage({ genre }: { genre: GenreThemeConfig }) {
  const book = genre.spotlightBook;
  return (
    <>
      <section className="crime-hero genre-wrap">
        <div className="crime-case-line">
          <span>PRIVATE INVESTIGATION ARCHIVE</span>
          <span>{book.code} / OPEN FILE</span>
        </div>
        <div className="crime-hero-grid">
          <div className="crime-hero-copy">
            <span className="crime-label">
              NEW CASE STUDY <i />
            </span>
            <p className="genre-kicker">CRIME / PSYCHOLOGICAL THRILLER</p>
            <h1>
              บางเรื่อง
              <br />
              ยิ่งอ่าน
              <br />
              <em>ยิ่งไม่ไว้ใจใคร</em>
            </h1>
            <p>{genre.tagline}</p>
            <a className="crime-link" href="#featured-review">
              เปิดแฟ้มคดีเด่น
            </a>
          </div>
          <div className="crime-evidence">
            <div className="evidence-tape">EVIDENCE / {book.code}</div>
            <BookCover book={book} genre="crime" large />
            <div className="evidence-note">
              <span>SUBJECT</span>
              <strong>{book.title}</strong>
              <span>STATUS: UNDER REVIEW</span>
            </div>
          </div>
        </div>
        <div className="crime-bottom-line">
          <span>CONFIDENTIAL READING ROOM</span>
          <span>SCROLL FOR EVIDENCE ↓</span>
        </div>
      </section>
      <section id="featured-review" className="crime-feature genre-wrap">
        <div className="crime-stamp">{book.code || "FILE"}</div>
        <div>
          <p className="eyebrow">THE LEAD / {book.code}</p>
          <h2>{book.title}</h2>
          <p className="genre-secondary-title">
            {book.englishTitle} · {book.author}
          </p>
          {book.highlightQuote && (
            <blockquote>“{book.highlightQuote}”</blockquote>
          )}
          <p>{book.synopsis}</p>
          <Rating book={book} />
          <BookDetails book={book} genre="crime" />
        </div>
        <aside>
          <p>PSYCHOLOGICAL PROFILE</p>
          <Metrics genre={genre} />
        </aside>
      </section>
      <section className="genre-wrap crime-archive">
        <SectionHead
          overline="THE ARCHIVE"
          title="แฟ้มคดีที่ยังไม่ปิด"
          aside="MORE CASE FILES"
        />
        <BookShelves genres={[genre]} compact />
      </section>
    </>
  );
}

function ClassicsPage({ genre }: { genre: GenreThemeConfig }) {
  const book = genre.spotlightBook;
  return (
    <>
      <section className="classics-hero genre-wrap">
        <p className="classics-topline">
          THE READER&apos;S LIBRARY <span>EST. IN EVERY CENTURY</span>
        </p>
        <div className="classics-hero-layout">
          <div>
            <p className="eyebrow">A COLLECTION OF TIMELESS STORIES</p>
            <h1>
              บางถ้อยคำ
              <br />
              <em>อยู่กับเราตลอดไป</em>
            </h1>
            <p className="classics-lead">{genre.tagline}</p>
            <a href="#featured-review" className="classics-link">
              เปิดอ่านเล่มประจำห้องสมุด
            </a>
          </div>
          <div className="classics-display">
            <div className="classics-arch">
              <BookCover book={book} genre="classics" large />
            </div>
            <span>THE BOOK THAT STAYS WITH YOU</span>
          </div>
        </div>
        <div className="classics-bottom">
          <span>CURATED WITH LOVE FOR THE WRITTEN WORD</span>
          <span>VOL. I / FAMILY JS</span>
        </div>
      </section>
      <section id="featured-review" className="classics-feature genre-wrap">
        <div className="classics-ornament">❦</div>
        <p className="eyebrow">FROM THE PERMANENT COLLECTION</p>
        <h2>{book.title}</h2>
        <p className="genre-secondary-title">
          {book.englishTitle} · {book.author}
        </p>
        {book.highlightQuote && (
          <blockquote>“{book.highlightQuote}”</blockquote>
        )}
        <p>{book.synopsis}</p>
        <div className="classics-feature-foot">
          <Rating book={book} />
          <BookDetails book={book} genre="classics" />
        </div>
        <Metrics genre={genre} />
      </section>
      <section className="classics-shelf genre-wrap">
        <SectionHead
          overline="ON THE SHELF"
          title="หยิบเล่มต่อไป"
          aside="THE READING LIST"
        />
        <BookShelves genres={[genre]} compact />
      </section>
    </>
  );
}

function WuxiaPage({ genre }: { genre: GenreThemeConfig }) {
  const book = genre.spotlightBook;
  return (
    <>
      <section className="wuxia-hero">
        <div className="wuxia-mountain mountain-one" />
        <div className="wuxia-mountain mountain-two" />
        <div className="wuxia-mountain mountain-three" />
        <div className="genre-wrap wuxia-hero-inner">
          <p className="eyebrow">A JOURNEY THROUGH THE JIANGHU</p>
          <div className="wuxia-title-row">
            <h1>
              หนึ่งกระบี่
              <br />
              หนึ่งเรื่องเล่า
              <br />
              <em>ใต้ฟ้าเดียวกัน</em>
            </h1>
            <span className="wuxia-seal">
              อ่าน
              <br />
              ยุทธภพ
            </span>
          </div>
          <p>{genre.tagline}</p>
          <a href="#featured-review" className="wuxia-link">
            เริ่มการเดินทาง
          </a>
        </div>
        <span className="wuxia-hanzi" aria-hidden="true">
          江湖
        </span>
      </section>
      <section id="featured-review" className="wuxia-feature genre-wrap">
        <div className="wuxia-scroll">
          <div className="wuxia-scroll-line" />
          <div>
            <p className="eyebrow">คัมภีร์เล่มเด่น / FEATURED SCROLL</p>
            <h2>{book.title}</h2>
            <p className="genre-secondary-title">
              {book.englishTitle} · {book.author}
            </p>
            {book.highlightQuote && (
              <blockquote>“{book.highlightQuote}”</blockquote>
            )}
            <p>{book.synopsis}</p>
            <Rating book={book} />
            <BookDetails book={book} genre="wuxia" />
          </div>
          <BookCover book={book} genre="wuxia" large />
        </div>
        <Metrics genre={genre} />
      </section>
      <section className="wuxia-journey genre-wrap">
        <SectionHead
          overline="PATHS THROUGH THE JIANGHU"
          title="เส้นทางในยุทธภพ"
        />
        <div className="wuxia-paths">
          {genre.subGenres.map((item) => (
            <div key={item.name}>
              <span>✦</span>
              <h3>{item.name}</h3>
              <p>{item.english}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="wuxia-books genre-wrap">
        <SectionHead overline="MORE SCROLLS" title="คัมภีร์บนชั้น" />
        <BookShelves genres={[genre]} compact />
      </section>
    </>
  );
}

function RomancePage({ genre }: { genre: GenreThemeConfig }) {
  const book = genre.spotlightBook;
  return (
    <>
      <section className="romance-hero">
        <div className="genre-wrap romance-hero-inner">
          <div>
            <p className="eyebrow">DEAR READER, THIS ONE IS FOR YOU</p>
            <h1>
              เปิดหน้าถัดไป
              <br />
              <em>แล้วตกหลุมรัก</em>
            </h1>
            <p>{genre.tagline}</p>
            <a href="#featured-review" className="romance-link">
              อ่านจดหมายฉบับนี้
            </a>
          </div>
          <div className="romance-collage">
            <span className="romance-heart heart-one">♡</span>
            <div className="romance-photo">
              <BookCover book={book} genre="romance" large />
              <span>with love, Family JS</span>
            </div>
            <span className="romance-heart heart-two">✳</span>
          </div>
        </div>
      </section>
      <section id="featured-review" className="romance-feature genre-wrap">
        <div className="romance-letter">
          <p className="eyebrow">A LITTLE LETTER ABOUT A BOOK</p>
          <span className="romance-letter-mark">♡</span>
          <h2>{book.title}</h2>
          <p className="genre-secondary-title">
            {book.englishTitle} · {book.author}
          </p>
          {book.highlightQuote && (
            <blockquote>“{book.highlightQuote}”</blockquote>
          )}
          <p>{book.synopsis}</p>
          <div className="romance-letter-footer">
            <Rating book={book} />
            <BookDetails book={book} genre="romance" />
          </div>
        </div>
        <div className="romance-mood">
          <h3>HOW IT FEELS</h3>
          <Metrics genre={genre} />
          <p>หนังสือที่อยากอ่านช้า ๆ ในบ่ายวันหยุด</p>
        </div>
      </section>
      <section className="romance-books genre-wrap">
        <SectionHead
          overline="MORE STORIES TO FALL FOR"
          title="เล่มที่อยากส่งต่อให้เธอ"
        />
        <BookShelves genres={[genre]} compact />
      </section>
    </>
  );
}

function MangaPage({ genre }: { genre: GenreThemeConfig }) {
  const book = genre.spotlightBook;
  return (
    <>
      <section className="manga-hero genre-wrap">
        <div className="manga-issue">
          <span>FAMILY JS / MANGA</span>
          <span>
            {book.code ? `${book.code} / NOW READING` : "NOW READING"}
          </span>
        </div>
        <div className="manga-hero-grid">
          <div className="manga-title-panel">
            <p className="eyebrow">MANGA & GRAPHIC NOVELS</p>
            <h1>
              พลิกหน้า
              <br />
              แล้วโลก
              <br />
              <em>เปลี่ยนไป!</em>
            </h1>
            <p>{genre.tagline}</p>
            <a href="#featured-review" className="manga-link">
              อ่านตอนเด่น
            </a>
          </div>
          <div className="manga-visual-panel">
            <span className="manga-burst" aria-hidden="true">
              WOW!
            </span>
            <BookCover book={book} genre="manga" large />
            <div className="manga-caption">THE NEXT BIG READ</div>
          </div>
        </div>
        <div className="manga-bottom">
          <span>INK / ACTION / IMAGINATION</span>
          <span>TO BE CONTINUED...</span>
        </div>
      </section>
      <section id="featured-review" className="manga-feature genre-wrap">
        <div className="manga-feature-title">
          <span>FEATURED CHAPTER</span>
          <h2>{book.title}</h2>
          <p>
            {book.englishTitle} · {book.author}
          </p>
        </div>
        <div className="manga-feature-body">
          {book.highlightQuote && (
            <blockquote>“{book.highlightQuote}”</blockquote>
          )}
          <p>{book.synopsis}</p>
          <Rating book={book} />
          <BookDetails book={book} genre="manga" />
        </div>
        <div className="manga-power">
          <p>POWER LEVEL / REVIEW METRICS</p>
          <Metrics genre={genre} />
        </div>
      </section>
      <section className="manga-books genre-wrap">
        <SectionHead
          overline="THE NEXT CHAPTER"
          title="เรื่องที่ต้องอ่านต่อ"
          aside="FRESH PANELS"
        />
        <BookShelves genres={[genre]} compact />
      </section>
    </>
  );
}

export function GenreExperience({ genre }: { genre: GenreThemeConfig }) {
  const pages = {
    crime: CrimePage,
    classics: ClassicsPage,
    wuxia: WuxiaPage,
    romance: RomancePage,
    manga: MangaPage,
  };
  const Page = pages[genre.id];
  return (
    <div className={`bokk genre-page genre-${genre.id}`}>
      <MotionEffects />
      <GenreNav active={genre.id} />
      <main>
        <Page genre={genre} />
      </main>
      <footer className="bokk-footer">
        <span>
          FAMILY JS © <CurrentYear />
        </span>
        <Link href="/blog">บล็อกทั่วไป</Link>
        <Link href="/about">เกี่ยวกับเรา</Link>
        <span>{genre.englishName.toUpperCase()}</span>
      </footer>
    </div>
  );
}

export function GenreEmpty({ id }: { id: GenreId }) {
  const genre = GENRE_THEMES[id];
  return (
    <div className={`bokk genre-page genre-${id}`}>
      <MotionEffects />
      <GenreNav active={id} />
      <main className="genre-empty">
        <div className="genre-empty-content">
          <p className="eyebrow">FAMILY JS / {genre.englishName}</p>
          <h1>{genre.name}</h1>
          <p>ยังไม่มีหนังสือที่เผยแพร่ในหมวดนี้</p>
          <Link href="/">กลับไปเลือกตู้หนังสือ</Link>
        </div>
      </main>
      <footer className="bokk-footer">
        <span>
          FAMILY JS © <CurrentYear />
        </span>
        <Link href="/blog">บล็อกทั่วไป</Link>
        <Link href="/about">เกี่ยวกับเรา</Link>
        <span>{genre.englishName.toUpperCase()}</span>
      </footer>
    </div>
  );
}
