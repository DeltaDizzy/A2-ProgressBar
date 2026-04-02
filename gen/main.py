import argparse
from pathlib import Path

blocks = [
    (225, 430),
    (320, 325),
    (650, 850),
    (850, 1050),
    (940, 1140),
    (1420, 1610),
    (1610, 1820),
    (1820, 2010),
    (2010, 2220),
    (2220, 2400),
    (3100, 3320)

]

try:
    import fitz  # PyMuPDF
except ImportError as exc:
    raise ImportError("PyMuPDF is required. Install with `pip install pymupdf`.") from exc

try:
    from PIL import Image
except ImportError as exc:
    raise ImportError("Pillow is required. Install with `pip install pillow`.") from exc


def pdf_to_single_image(pdf_path, output_path=None, dpi=150, image_format="PNG", split_blocks=False):
    """Render a multi-page PDF into one tall image.

    Args:
        pdf_path (str | Path): path to source PDF.
        output_path (str | Path | None): path to save assembled image. If None, uses pdf_path stem + _full.png.
        dpi (int): rendering resolution for each page.
        image_format (str): Pillow format, e.g., 'PNG', 'JPEG'.

    Returns:
        Path: output image path.
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    if output_path is None:
        output_path = pdf_path.with_name(f"{pdf_path.stem}_full.{image_format.lower()}")
    output_path = Path(output_path)

    doc = fitz.open(pdf_path)
    if len(doc) == 0:
        raise ValueError("PDF file has no pages")

    render_list = []
    total_height = 0
    max_width = 0

    matrix = fitz.Matrix(dpi / 72.0, dpi / 72.0)
    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=matrix, alpha=False)

        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        render_list.append(img)

        total_height += img.height
        max_width = max(max_width, img.width)

    if max_width == 0 or total_height == 0:
        raise RuntimeError("Empty rendered PDF pages")

    combined = Image.new("RGB", (max_width, total_height), "white")

    y_offset = 0
    for img in render_list:
        if img.width != max_width:
            # pad narrower pages to full width (centered horizontally)
            page_canvas = Image.new("RGB", (max_width, img.height), "white")
            page_canvas.paste(img, ((max_width - img.width) // 2, 0))
            img_to_paste = page_canvas
        else:
            img_to_paste = img

        combined.paste(img_to_paste, (0, y_offset))
        y_offset += img_to_paste.height

    combined.save(output_path, format=image_format)

    if split_blocks:
        # scale block boundaries if dpi differs from the baseline 150
        dpi_scale = dpi / 150.0
        save_blocks_from_image(combined, output_path.parent, image_format=image_format, dpi_scale=dpi_scale)

    return output_path


def save_blocks_from_image(image, output_dir, *, image_format="PNG", dpi_scale=1.0):
    """Save specified vertical blocks from a full-image crop list into images.

    First block is saved as "header", subsequent blocks as FD01, FD02, etc.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for idx, (y0, y1) in enumerate(blocks):
        scaled_y0 = int(round(y0 * dpi_scale))
        scaled_y1 = int(round(y1 * dpi_scale))

        if scaled_y0 < 0 or scaled_y1 > image.height or scaled_y0 >= scaled_y1:
            raise ValueError(
                f"Invalid scaled block boundaries: {(scaled_y0, scaled_y1)} for image height {image.height}"
            )

        crop = image.crop((0, scaled_y0, image.width, scaled_y1))

        if idx == 0:
            filename = f"header.{image_format.lower()}"
        else:
            filename = f"FD{idx:02d}.{image_format.lower()}"
        
        out_file = output_dir / filename
        crop.save(out_file, format=image_format)
        print(f"Saved block to: {out_file}")


def main():
    parser = argparse.ArgumentParser(description="Render PDF pages to one single tall image")
    parser.add_argument("pdf_file", help="Path to input PDF")
    parser.add_argument("-o", "--output", help="Output image file path")
    parser.add_argument("--dpi", type=int, default=300, help="Render DPI")
    parser.add_argument("--format", default="PNG", help="Image format: PNG, JPEG")
    parser.add_argument("--split-blocks", action="store_true", help="Save blocks from list 'blocks' as FDxx.png")

    args = parser.parse_args()

    out_path = pdf_to_single_image(
        args.pdf_file,
        args.output,
        dpi=args.dpi,
        image_format=args.format,
        split_blocks=args.split_blocks,
    )
    print(f"Saved combined image to: {out_path}")


if __name__ == "__main__":
    main()