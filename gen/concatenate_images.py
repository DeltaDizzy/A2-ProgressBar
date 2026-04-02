import argparse
import re
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise ImportError("Pillow is required. Install with `pip install pillow`.") from exc


def concatenate_fd_images(input_dir, output_path=None, image_format="PNG"):
    """Concatenate all FDxx.png images horizontally into one wide image.
    
    Args:
        input_dir (str | Path): directory containing FDxx.png images.
        output_path (str | Path | None): path to save result. If None, uses "concatenated.png".
        image_format (str): Pillow format, e.g., 'PNG', 'JPEG'.
    
    Returns:
        Path: output image path.
    """
    input_dir = Path(input_dir)
    if not input_dir.is_dir():
        raise NotADirectoryError(f"Directory not found: {input_dir}")
    
    if output_path is None:
        output_path = input_dir / f"concatenated.{image_format.lower()}"
    output_path = Path(output_path)
    
    # Find all FDxx.png files
    fd_files = sorted(
        input_dir.glob("FD*.png"),
        key=lambda p: int(re.search(r"FD(\d+)", p.name).group(1))
    )
    
    if not fd_files:
        raise FileNotFoundError(f"No FDxx.png files found in {input_dir}")
    
    # Load all images
    images = [Image.open(f) for f in fd_files]
    
    # Find max height and total width
    max_height = max(img.height for img in images)
    total_width = sum(img.width for img in images)
    
    # Create new image with white background
    combined = Image.new("RGB", (total_width, max_height), "white")
    
    # Paste each image, centered vertically
    x_offset = 0
    for img in images:
        # Center vertically
        y_offset = (max_height - img.height) // 2
        combined.paste(img, (x_offset, y_offset))
        x_offset += img.width
    
    combined.save(output_path, format=image_format)
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Concatenate FDxx.png images horizontally into one wide image"
    )
    parser.add_argument(
        "input_dir",
        help="Directory containing FDxx.png images"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output image file path"
    )
    parser.add_argument(
        "--format",
        default="PNG",
        help="Image format: PNG, JPEG"
    )
    
    args = parser.parse_args()
    
    out_path = concatenate_fd_images(args.input_dir, args.output, image_format=args.format)
    print(f"Saved concatenated image to: {out_path}")


if __name__ == "__main__":
    main()
