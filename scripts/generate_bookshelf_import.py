"""Generate a Supabase SQL Editor import from a Bookshelf XLSX export.

Usage: python scripts/generate_bookshelf_import.py input.xlsx output.sql --type-map cabinets.xlsx
Requires: openpyxl
"""

from __future__ import annotations

import argparse
import json
import uuid
from collections import Counter
from datetime import date, datetime
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation


NAMESPACE = uuid.UUID("703bcd86-31ad-4eb1-a5fb-43f834088d7c")
ADMIN_EMAIL = "dongjs.dev@gmail.com"
CABINETS = {
    "crime": "สืบสวน / ระทึกขวัญ",
    "classics": "วรรณกรรมคลาสสิก",
    "wuxia": "กำลังภายใน",
    "romance": "โรแมนซ์",
    "manga": "มังงะ",
}
LABEL_TO_CABINET = {label: slug for slug, label in CABINETS.items()}


def sql_text(value: object) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def as_json(value: object) -> object:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def cell_text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def guess_genre(tags: str | None) -> str:
    tag = (tags or "").casefold()
    if "กำลังภายใน" in tag:
        return "wuxia"
    crime_markers = (
        "robert hunter", "tess series", "tess alone", "เสียงกระซิบ",
        "คางะ", "คฤหาสน์", "ซีรีย์เสพติด", "อกาธา", "คินดะอิจิ",
        "นักสืบ", "harlan coben", "ผีญี่ปุ่น", "กาลิเลโอ",
    )
    if any(marker in tag for marker in crime_markers):
        return "crime"
    return "classics"  # Safe draft-only holding category for uncertain genres.


def apply_type_map(path: Path, records: list[dict[str, object]]) -> None:
    """Create an editable cabinet workbook once, then use its selected values."""
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Cabinets"
        sheet.append(["Book Id", "Title", "Tags", "Bookshelf", "Suggested Cabinet", "Cabinet Type"])
        for record in records:
            raw = record["raw"]
            assert isinstance(raw, dict)
            suggested = CABINETS[str(record["genre"])]
            sheet.append([
                record["source_id"], raw["Title"], raw["Tags"], raw["Bookshelf"],
                suggested, suggested,
            ])
        sheet.freeze_panes = "B2"
        sheet.auto_filter.ref = sheet.dimensions
        sheet.sheet_view.showGridLines = False
        for column, width in {"A": 16, "B": 55, "C": 30, "D": 25, "E": 27, "F": 27}.items():
            sheet.column_dimensions[column].width = width
        for cell in sheet[1]:
            cell.fill = PatternFill("solid", fgColor="31243F")
            cell.font = Font(color="FFFFFF", bold=True)
        for row in range(2, sheet.max_row + 1):
            if sheet.cell(row, 5).value == CABINETS["classics"]:
                sheet.cell(row, 6).fill = PatternFill("solid", fgColor="FFF1CC")
        choices = ",".join(CABINETS.values())
        validation = DataValidation(type="list", formula1=f'"{choices}"', allow_blank=False)
        validation.showErrorMessage = True
        validation.error = "เลือกตู้จากรายการที่กำหนด"
        sheet.add_data_validation(validation)
        validation.add(f"F2:F{sheet.max_row}")
        workbook.save(path)
        print(f"Created editable cabinet map: {path}")

    workbook = load_workbook(path, read_only=True, data_only=True)
    if "Cabinets" not in workbook.sheetnames:
        raise ValueError(f"Type map {path} has no Cabinets sheet")
    sheet = workbook["Cabinets"]
    headers = [cell.value for cell in sheet[1]]
    if "Book Id" not in headers or "Cabinet Type" not in headers:
        raise ValueError("Type map needs Book Id and Cabinet Type columns")
    id_index = headers.index("Book Id")
    type_index = headers.index("Cabinet Type")
    selected: dict[int, str] = {}
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if row[id_index] is None:
            continue
        source_id = int(row[id_index])
        if source_id in selected:
            raise ValueError(f"Duplicate Book Id {source_id} in type map")
        choice = str(row[type_index] or "").strip()
        genre = LABEL_TO_CABINET.get(choice, choice)
        if genre not in CABINETS:
            raise ValueError(f"Book Id {source_id}: invalid cabinet type {choice!r}")
        selected[source_id] = genre
    expected = {int(record["source_id"]) for record in records}
    if set(selected) != expected:
        raise ValueError(f"Type map IDs do not match export: missing={sorted(expected - set(selected))}, extra={sorted(set(selected) - expected)}")
    for record in records:
        record["genre"] = selected[int(record["source_id"])]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--type-map", type=Path, help="Editable XLSX with one cabinet type per book")
    args = parser.parse_args()

    workbook = load_workbook(args.input, read_only=True, data_only=True)
    if len(workbook.worksheets) != 1:
        raise ValueError("Expected one worksheet")
    rows = iter(workbook.active.values)
    headers = list(next(rows))
    required = {"Book Id", "ISBN", "Title", "Authors", "Translators", "Publisher", "Page Count", "Description", "My Rating", "Tags"}
    if not required.issubset(headers):
        raise ValueError(f"Missing columns: {sorted(required - set(headers))}")

    records: list[dict[str, object]] = []
    seen_ids: set[int] = set()
    for source_row, values in enumerate(rows, start=2):
        if all(value is None for value in values):
            continue
        raw = {name: as_json(value) for name, value in zip(headers, values, strict=True)}
        source_id = int(raw["Book Id"])
        if source_id in seen_ids:
            raise ValueError(f"Duplicate Book Id {source_id} at row {source_row}")
        seen_ids.add(source_id)
        title = cell_text(raw["Title"])
        if not title:
            raise ValueError(f"Missing title at row {source_row}")
        rating = raw["My Rating"]
        if rating is not None and (float(rating) < 1 or float(rating) > 5 or float(rating) * 2 != int(float(rating) * 2)):
            raise ValueError(f"Invalid rating at row {source_row}")
        tag_text = cell_text(raw["Tags"])
        records.append({
            "source_row": source_row,
            "source_id": source_id,
            "book_uuid": str(uuid.uuid5(NAMESPACE, f"book:{source_id}")),
            "review_uuid": str(uuid.uuid5(NAMESPACE, f"review:{source_id}")),
            "rating": rating,
            "genre": guess_genre(tag_text),
            "raw": raw,
        })

    if not records:
        raise ValueError("No books found")
    if args.type_map:
        apply_type_map(args.type_map, records)

    lines = [
        "-- Generated from " + args.input.name + ". Review genres and drafts before publishing.",
        "-- Cabinet selections: " + (args.type_map.name if args.type_map else "automatic tag suggestions") + ".",
        "-- To change cabinets, edit Cabinet Type in the XLSX map and regenerate this SQL BEFORE running it.",
        "-- Selected cabinets: " + ", ".join(f"{slug}={count}" for slug, count in sorted(Counter(str(r["genre"]) for r in records).items())) + ".",
        "-- Run once in Supabase SQL Editor after content migrations 001, 004, 006, 007.",
        "-- Safe to rerun: existing books/reviews/shelf placements are not overwritten.",
        "begin;",
        "",
        "do $$ begin",
        "  if to_regclass('public.books') is null or to_regclass('public.reviews') is null or to_regclass('public.genre_shelf_items') is null then",
        "    raise exception 'Run Family JS content migrations before importing the bookshelf';",
        "  end if;",
        "  if exists (select 1 from pg_policies where schemaname = 'public'",
        "             and (tablename, policyname) in (( 'books', 'allow_all_books'),",
        "               ('reviews', 'allow_all_reviews'), ('genre_shelf_items', 'allow_all_shelf'),",
        "               ('blog_posts', 'allow_all_blog'))) then",
        "    raise exception 'Run migration 004: old allow_all policies are still active';",
        "  end if;",
        "  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'books' and policyname = 'books_update')",
        "     or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'genre_shelf_items' and policyname = 'shelf_update') then",
        "    raise exception 'Run migration 006: restricted book/shelf policies are missing';",
        "  end if;",
        "  if not exists (",
        "    select 1 from auth.users u join public.profiles p on p.id = u.id",
        f"    where lower(u.email) = lower({sql_text(ADMIN_EMAIL)}) and p.role in ('admin', 'editor')",
        "  ) then",
        f"    raise exception 'Editor/admin account {ADMIN_EMAIL} was not found in auth.users/profiles';",
        "  end if;",
        "end $$;",
        "",
        "-- Unrated draft reviews must keep NULL rather than a made-up score.",
        "alter table public.reviews alter column rating drop not null;",
        "alter table public.reviews drop constraint if exists reviews_published_rating_required;",
        "alter table public.reviews add constraint reviews_published_rating_required check (status <> 'published' or rating is not null);",
        "",
        "create table if not exists public.bookshelf_imports (",
        "  source_book_id bigint primary key,",
        "  source_file text not null,",
        "  source_row integer not null,",
        "  raw_data jsonb not null,",
        "  book_id uuid references public.books(id) on delete set null,",
        "  review_id uuid references public.reviews(id) on delete set null,",
        "  imported_at timestamptz not null default now()",
        ");",
        "alter table public.bookshelf_imports enable row level security;",
        "revoke all on public.bookshelf_imports from public, anon, authenticated;",
        "",
        "create temp table _bookshelf_import (",
        "  source_row integer, source_book_id bigint, book_uuid uuid, review_uuid uuid,",
        "  genre_slug text, raw_data jsonb",
        ") on commit drop;",
        "",
    ]

    for record in records:
        fields = [
            str(record["source_row"]), str(record["source_id"]),
            sql_text(record["book_uuid"]), sql_text(record["review_uuid"]),
            sql_text(record["genre"]),
            sql_text(json.dumps(record["raw"], ensure_ascii=False, separators=(",", ":"))) + "::jsonb",
        ]
        lines.append("insert into _bookshelf_import values (" + ", ".join(fields) + ");")

    lines += [
        "",
        "alter table _bookshelf_import add column was_imported boolean not null default false;",
        "update _bookshelf_import t set was_imported = true",
        "where exists (select 1 from public.bookshelf_imports i where i.source_book_id = t.source_book_id);",
        "",
        "insert into public.bookshelf_imports (source_book_id, source_file, source_row, raw_data)",
        f"select source_book_id, {sql_text(args.input.name)}, source_row, raw_data from _bookshelf_import",
        "on conflict (source_book_id) do update set source_file = excluded.source_file, source_row = excluded.source_row, raw_data = excluded.raw_data;",
        "",
        "insert into public.books (id, isbn, title, author, translator, publisher, page_count, synopsis)",
        "select book_uuid, nullif(btrim(raw_data->>'ISBN'), ''),",
        "  btrim(raw_data->>'Title'), coalesce(nullif(btrim(raw_data->>'Authors'), ''), 'ไม่ระบุผู้เขียน'),",
        "  nullif(btrim(raw_data->>'Translators'), ''), nullif(btrim(raw_data->>'Publisher'), ''),",
        "  case when (raw_data->>'Page Count') ~ '^[1-9][0-9]*$' then (raw_data->>'Page Count')::integer else null end,",
        "  coalesce(raw_data->>'Description', '') from _bookshelf_import",
        "on conflict do nothing;",
        "",
        "update public.bookshelf_imports i set book_id = coalesce(",
        "  (select b.id from public.books b where b.isbn = nullif(btrim(t.raw_data->>'ISBN'), '')),",
        "  (select b.id from public.books b where b.id = t.book_uuid)",
        ") from _bookshelf_import t where i.source_book_id = t.source_book_id;",
        "",
        "do $$ declare import_author uuid; begin",
        "  select u.id into import_author from auth.users u join public.profiles p on p.id = u.id",
        f"  where lower(u.email) = lower({sql_text(ADMIN_EMAIL)}) and p.role in ('admin', 'editor');",
        "  insert into public.reviews (id, book_id, author_id, slug, title, summary, content, tags, rating, status)",
        "  select t.review_uuid, i.book_id, import_author, 'bookshelf-' || t.source_book_id,",
        "    'รีวิว ' || btrim(t.raw_data->>'Title'), '', '',",
        "    case when nullif(btrim(t.raw_data->>'Tags'), '') is null then '{}'::text[]",
        "         else array[btrim(t.raw_data->>'Tags')] end,",
        "    (t.raw_data->>'My Rating')::numeric, 'draft'",
        "  from _bookshelf_import t join public.bookshelf_imports i using (source_book_id)",
        "  on conflict do nothing;",
        "end $$;",
        "",
        "update public.bookshelf_imports i set review_id = r.id",
        "from _bookshelf_import t join public.reviews r on r.id = t.review_uuid",
        "where i.source_book_id = t.source_book_id;",
        "",
        "do $$ begin",
        "  if exists (select 1 from public.bookshelf_imports i join _bookshelf_import t using (source_book_id)",
        "             where i.book_id is null or i.review_id is null) then",
        "    raise exception 'Some books or reviews could not be linked; import rolled back';",
        "  end if;",
        "end $$;",
        "",
        "with missing as (",
        "  select t.genre_slug, i.review_id, t.source_book_id,",
        "    row_number() over (partition by t.genre_slug order by t.source_row)::integer as position",
        "  from _bookshelf_import t join public.bookshelf_imports i using (source_book_id)",
        "  where not t.was_imported",
        "    and not exists (select 1 from public.genre_shelf_items s where s.review_id = i.review_id)",
        "), bases as (",
        "  select genre_slug, max(sort_order) as last_order from public.genre_shelf_items group by genre_slug",
        ")",
        "insert into public.genre_shelf_items (genre_slug, review_id, sort_order, code, stamp_text, stamp_variant)",
        "select m.genre_slug, m.review_id, coalesce(b.last_order, -1) + m.position,",
        "  'IMPORT #' || m.source_book_id, 'DRAFT', 'amber'",
        "from missing m left join bases b using (genre_slug)",
        "on conflict do nothing;",
        "",
        "do $$ begin",
        "  if exists (select 1 from _bookshelf_import t join public.bookshelf_imports i using (source_book_id)",
        "             where not t.was_imported",
        "               and not exists (select 1 from public.genre_shelf_items s where s.review_id = i.review_id)) then",
        "    raise exception 'Some shelf placements could not be created; import rolled back';",
        "  end if;",
        "end $$;",
        "",
        "commit;",
        "",
        "select count(*) as imported_source_rows, count(book_id) as linked_books, count(review_id) as draft_reviews",
        f"from public.bookshelf_imports where source_file = {sql_text(args.input.name)};",
        "",
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {args.output}: {len(records)} books, {sum(r['rating'] is None for r in records)} unrated drafts, genres {dict(Counter(r['genre'] for r in records))}")


if __name__ == "__main__":
    main()
