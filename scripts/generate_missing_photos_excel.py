import re
import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

txt_path = '/Users/hrushi/Downloads/Pnr Shop/pnr product photos/missing_product_photos.txt'
out_xlsx_path = '/Users/hrushi/Downloads/Pnr Shop/pnr product photos/missing_product_photos.xlsx'

with open(txt_path, 'r', encoding='utf-8') as f:
    text = f.read()

# ---------------------------------------------------------
# 1. PARSE ALL DATA
# ---------------------------------------------------------

# Section 1: Categories and Missing Items
sec1_match = re.search(r'SECTION 1: PRODUCTS MISSING PHOTOS.*?(?=SECTION 2:)', text, re.DOTALL)
categories_summary = []
all_missing_items = []

if sec1_match:
    sec1 = sec1_match.group(0)
    cat_blocks = re.findall(r'CATEGORY:\s*([^(\n]+)\s*\(([^)]+)\)\s*-+\s*(.*?)(?=(?:-+|\n\s*CATEGORY:|$))', sec1, re.DOTALL)
    for cat_name, stats, items_text in cat_blocks:
        cat_name = cat_name.strip()
        m = re.search(r'(\d+)\s*missing\s*/\s*(\d+)\s*total', stats)
        missing_count = int(m.group(1)) if m else 0
        total_count = int(m.group(2)) if m else 0
        
        cat_items = []
        for line in items_text.strip().split('\n'):
            line = line.strip()
            if line.startswith('[ ]'):
                item_m = re.search(r'\[ \]\s*\d+\.\s*(.*?)\s*\((₹?\d+|Price TBD)\)', line)
                if item_m:
                    pname = item_m.group(1).strip()
                    price_str = item_m.group(2).strip()
                    cat_items.append({'name': pname, 'price': price_str, 'category': cat_name})
                    all_missing_items.append({'name': pname, 'price': price_str, 'category': cat_name})
        
        categories_summary.append({
            'category': cat_name,
            'total': total_count,
            'missing': missing_count,
            'covered': total_count - missing_count,
            'pct_covered': (total_count - missing_count) / total_count if total_count > 0 else 0,
            'items': cat_items
        })

# Section 3: Matched Items
sec3_match = re.search(r'SECTION 3: PRODUCTS WITH CONFIRMED STRICT PHOTO MATCH.*?(?=SECTION 4:)', text, re.DOTALL)
matched_items = []
if sec3_match:
    sec3 = sec3_match.group(0)
    cat_blocks = re.findall(r'\[(.*?)\]\s*(.*?)(?=(?:\[|$))', sec3, re.DOTALL)
    for cat_name, block in cat_blocks:
        lines = [l.strip() for l in block.strip().split('\n') if l.strip().startswith('✓')]
        for line in lines:
            m = re.search(r'✓\s*(.*?)\s*\((₹?\d+)\)\s*===>\s*\"(.*?)\"', line)
            if m:
                matched_items.append({
                    'category': cat_name.strip(),
                    'name': m.group(1).strip(),
                    'price': m.group(2).strip(),
                    'photo': m.group(3).strip()
                })

# Section 4: Unmatched Photos in Directory
unmatched_items = [
    # A. Near Matches
    {'group': 'Near Match / Rename Candidate', 'photo': 'Chick Mushroom Puff.jpeg', 'folder': 'Root', 'target': 'CHICKEN MUSHROOM PUFF [BAKED SNACKS]', 'action': 'Rename file to "CHICKEN MUSHROOM PUFF.jpeg" to auto-match catalog', 'urgency': 'Quick Win (Instant Match)'},
    {'group': 'Near Match / Rename Candidate', 'photo': 'Cinnamon Doughnut.jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'CINAMON [SWEET TOOTH]', 'action': 'Rename file to "CINAMON.jpeg" or assign to Cinnamon Doughnut', 'urgency': 'Quick Win (Instant Match)'},
    {'group': 'Near Match / Rename Candidate', 'photo': 'Mexxican sandwich.jpeg', 'folder': 'Root', 'target': 'VEG/CHICKEN MEXICAN TOAST [BAKED SNACKS]', 'action': 'Assign to Mexican Toast item or rename file', 'urgency': 'Quick Win (Instant Match)'},
    {'group': 'Near Match / Rename Candidate', 'photo': 'SWEET TOAST.jpeg', 'folder': 'Root', 'target': 'RUSK (SWEET TOAST) [HIGH TEA]', 'action': 'Rename file to "RUSK (SWEET TOAST).jpeg" to match catalog title', 'urgency': 'Quick Win (Instant Match)'},
    {'group': 'Near Match / Rename Candidate', 'photo': 'colored doughnut.jpeg', 'folder': 'Root', 'target': 'COLORED CHOCOLATE DOUGHNUT [SWEET TOOTH]', 'action': 'Rename file to "COLORED CHOCOLATE DOUGHNUT.jpeg"', 'urgency': 'Quick Win (Instant Match)'},
    {'group': 'Near Match / Rename Candidate', 'photo': 'sprinkled Doughnut.jpeg', 'folder': 'Root', 'target': 'ICED SPRINKLE DOUGHNUT [SWEET TOOTH]', 'action': 'Rename file to "ICED SPRINKLE DOUGHNUT.jpeg"', 'urgency': 'Quick Win (Instant Match)'},
    
    # B. Generic Covers
    {'group': 'Generic Food Group Cover', 'photo': 'Calzone.jpeg', 'folder': 'Root', 'target': 'VEG CALZONE & CHICKEN CALZONE', 'action': 'Can serve as fallback group photo; dedicated variant photos recommended', 'urgency': 'Generic Fallback'},
    {'group': 'Generic Food Group Cover', 'photo': 'FLAKY TUSKAN.jpeg', 'folder': 'Root', 'target': 'VEG & CHICKEN FLAKY TUSKAN', 'action': 'Can serve as fallback group photo; dedicated variant photos recommended', 'urgency': 'Generic Fallback'},
    {'group': 'Generic Food Group Cover', 'photo': 'Khari.jpeg', 'folder': 'Root', 'target': 'SPECIAL KHARI & JEERA KHARI', 'action': 'General khari shot; dedicated khari photos already taken and matched', 'urgency': 'Generic Fallback'},
    {'group': 'Generic Food Group Cover', 'photo': 'croissant.jpeg', 'folder': 'Root', 'target': '6 Croissant Variants (Butter, Cheese, Chocolate, etc.)', 'action': 'Can serve as generic cover; individual flavor photos recommended', 'urgency': 'Generic Fallback'},

    # C. Cafe Snacks & Ice Creams
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Belgian Chocolate.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Black current.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Bluberry Cheesecake.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Burgers.jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'Hot Cafe Food Menu', 'action': 'Add item to cafe snacks menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Chicken Mayo.jpeg', 'folder': 'Root', 'target': 'Hot Cafe / Sandwich Menu', 'action': 'Add item to sandwich menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Chicken Salami.jpeg', 'folder': 'Root', 'target': 'Hot Cafe / Sandwich Menu', 'action': 'Add item to sandwich menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Chocolate Sugar free.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to sugar-free ice cream menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Coffee Walnut.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Cotton Candy.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Ferrero Rocher.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'French Fries.jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'Hot Cafe Food Menu', 'action': 'Add item to cafe snacks menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'French Vanilla.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Kitkat Shake.jpeg', 'folder': 'Root', 'target': 'Beverages & Shakes Menu', 'action': 'Add item to shakes menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Maggie.jpeg', 'folder': 'Root', 'target': 'Hot Cafe Food Menu', 'action': 'Add item to cafe food menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Milk Shakes.jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'Beverages & Shakes Menu', 'action': 'Add item to shakes menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'RajBhog.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Roasted Almond.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Rum n Raisin.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Salted Butter Caramel.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to digital ice cream flavor board', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Vanilla Madagascar Sugar free.jpeg', 'folder': 'ICECREAM/', 'target': 'Ice Cream Flavor Menu', 'action': 'Add item to sugar-free ice cream menu', 'urgency': 'Catalog Addition'},
    {'group': 'Uncataloged Item (Cafe / Ice Cream)', 'photo': 'Wrap.jpeg', 'folder': 'Root', 'target': 'Hot Cafe / Roll Menu', 'action': 'Add item to wraps & rolls menu', 'urgency': 'Catalog Addition'},

    # D. Unlabeled Camera Photos
    {'group': 'Unlabeled Camera Photo (WhatsApp)', 'photo': 'WhatsApp Image 2026-11-02 at 5.27.38 PM.jpeg', 'folder': 'Root', 'target': 'Requires Visual Inspection', 'action': 'Review photo visual and rename to exact product name', 'urgency': 'Inspection Needed'},
    {'group': 'Unlabeled Camera Photo (WhatsApp)', 'photo': 'WhatsApp Image 2026-11-02 at 5.27.38 PM (1).jpeg', 'folder': 'Root', 'target': 'Requires Visual Inspection', 'action': 'Review photo visual and rename to exact product name', 'urgency': 'Inspection Needed'},
    {'group': 'Unlabeled Camera Photo (WhatsApp)', 'photo': 'WhatsApp Image 2026-11-02 at 5.27.42 PM.jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'Requires Visual Inspection', 'action': 'Review photo visual and rename to exact product name', 'urgency': 'Inspection Needed'},
    {'group': 'Unlabeled Camera Photo (WhatsApp)', 'photo': 'WhatsApp Image 2026-11-02 at 5.27.44 PM (2).jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'Requires Visual Inspection', 'action': 'Review photo visual and rename to exact product name', 'urgency': 'Inspection Needed'},
    {'group': 'Unlabeled Camera Photo (WhatsApp)', 'photo': 'WhatsApp Image 2026-11-02 at 5.27.44 PM.jpeg', 'folder': 'SNACKS GENERAL/', 'target': 'Requires Visual Inspection', 'action': 'Review photo visual and rename to exact product name', 'urgency': 'Inspection Needed'},
    {'group': 'Unlabeled Camera Photo (WhatsApp)', 'photo': 'WhatsApp Image 2026-11-02 at 5.27.28 PM.jpeg', 'folder': 'ICECREAM/', 'target': 'Requires Visual Inspection', 'action': 'Review photo visual and rename to exact product name', 'urgency': 'Inspection Needed'},
]

# Quick win lookup dict
quick_wins_lookup = {
    'CHICKEN MUSHROOM PUFF': '⚠️ Photo "Chick Mushroom Puff.jpeg" in folder -> Rename to match',
    'CINAMON': '⚠️ Photo "Cinnamon Doughnut.jpeg" in SNACKS GENERAL/ -> Rename to match',
    'VEG MEXICAN TOAST': '⚠️ Photo "Mexxican sandwich.jpeg" in folder -> Usable for Mexican Toast',
    'CHICKEN MEXICAN TOAST': '⚠️ Photo "Mexxican sandwich.jpeg" in folder -> Usable for Mexican Toast',
    'RUSK (SWEET TOAST)': '⚠️ Photo "SWEET TOAST.jpeg" in folder -> Rename to match',
    'COLORED CHOCOLATE DOUGHNUT': '⚠️ Photo "colored doughnut.jpeg" in folder -> Rename to match',
    'ICED SPRINKLE DOUGHNUT': '⚠️ Photo "sprinkled Doughnut.jpeg" in folder -> Rename to match',
    'VEG CALZONE': 'ℹ️ Generic photo "Calzone.jpeg" available in folder',
    'CHICKEN CALZONE': 'ℹ️ Generic photo "Calzone.jpeg" available in folder',
    'VEG FLAKY TUSKAN': 'ℹ️ Generic photo "FLAKY TUSKAN.jpeg" available in folder',
    'CHICKEN FLAKY TUSKAN': 'ℹ️ Generic photo "FLAKY TUSKAN.jpeg" available in folder',
    'BUTTER CROISSANT': 'ℹ️ Generic photo "croissant.jpeg" available in folder',
    'CHEESE CROISSANT': 'ℹ️ Generic photo "croissant.jpeg" available in folder',
    'CHOCOLATE CROISSANT': 'ℹ️ Generic photo "croissant.jpeg" available in folder',
    'ALMOND CHOCOLATE CROISSANT': 'ℹ️ Generic photo "croissant.jpeg" available in folder',
    'NUTELLA CROISSANT': 'ℹ️ Generic photo "croissant.jpeg" available in folder',
    'COFFEE CROISSANT': 'ℹ️ Generic photo "croissant.jpeg" available in folder',
}

# ---------------------------------------------------------
# 2. SETUP WORKBOOK & STYLES
# ---------------------------------------------------------
wb = openpyxl.Workbook()
# remove default sheet
wb.remove(wb.active)

# Color Palette
COLOR_OBSIDIAN = '1C1917'     # #1C1917
COLOR_CHARCOAL = '292524'     # #292524
COLOR_STONE_LIGHT = 'F5F5F4'  # #F5F5F4
COLOR_STONE_ROW = 'FAFAF9'    # #FAFAF9
COLOR_STONE_BORDER = 'E7E5E4' # #E7E5E4
COLOR_RED_FILL = 'FEE2E2'     # #FEE2E2
COLOR_RED_TEXT = '991B1B'     # #991B1B
COLOR_GREEN_FILL = 'DCFCE7'   # #DCFCE7
COLOR_GREEN_TEXT = '166534'   # #166534
COLOR_AMBER_FILL = 'FEF3C7'   # #FEF3C7
COLOR_AMBER_TEXT = '92400E'   # #92400E
COLOR_SKY_FILL = 'E0F2FE'     # #E0F2FE
COLOR_SKY_TEXT = '0369A1'     # #0369A1

# Reusable Fonts
font_title = Font(name='Segoe UI', size=16, bold=True, color='1C1917')
font_subtitle = Font(name='Segoe UI', size=10, italic=True, color='57534E')
font_section = Font(name='Segoe UI', size=12, bold=True, color='1C1917')
font_th = Font(name='Segoe UI', size=10, bold=True, color='FFFFFF')
font_cell = Font(name='Segoe UI', size=10, color='1C1917')
font_cell_bold = Font(name='Segoe UI', size=10, bold=True, color='1C1917')
font_cell_code = Font(name='Consolas', size=9, color='44403C')
font_kpi_num = Font(name='Segoe UI', size=20, bold=True, color='1C1917')
font_kpi_label = Font(name='Segoe UI', size=9, bold=True, color='78716C')

# Fills
fill_th = PatternFill(start_color=COLOR_CHARCOAL, end_color=COLOR_CHARCOAL, fill_type='solid')
fill_th_dark = PatternFill(start_color=COLOR_OBSIDIAN, end_color=COLOR_OBSIDIAN, fill_type='solid')
fill_alt = PatternFill(start_color=COLOR_STONE_ROW, end_color=COLOR_STONE_ROW, fill_type='solid')
fill_white = PatternFill(start_color='FFFFFF', end_color='FFFFFF', fill_type='solid')
fill_total = PatternFill(start_color='E7E5E4', end_color='E7E5E4', fill_type='solid')
fill_kpi = PatternFill(start_color='F5F5F4', end_color='F5F5F4', fill_type='solid')

fill_red_badge = PatternFill(start_color=COLOR_RED_FILL, end_color=COLOR_RED_FILL, fill_type='solid')
font_red_badge = Font(name='Segoe UI', size=9, bold=True, color=COLOR_RED_TEXT)

fill_green_badge = PatternFill(start_color=COLOR_GREEN_FILL, end_color=COLOR_GREEN_FILL, fill_type='solid')
font_green_badge = Font(name='Segoe UI', size=9, bold=True, color=COLOR_GREEN_TEXT)

fill_amber_badge = PatternFill(start_color=COLOR_AMBER_FILL, end_color=COLOR_AMBER_FILL, fill_type='solid')
font_amber_badge = Font(name='Segoe UI', size=9, bold=True, color=COLOR_AMBER_TEXT)

fill_sky_badge = PatternFill(start_color=COLOR_SKY_FILL, end_color=COLOR_SKY_FILL, fill_type='solid')
font_sky_badge = Font(name='Segoe UI', size=9, bold=True, color=COLOR_SKY_TEXT)

# Borders
border_thin = Border(
    left=Side(style='thin', color=COLOR_STONE_BORDER),
    right=Side(style='thin', color=COLOR_STONE_BORDER),
    top=Side(style='thin', color=COLOR_STONE_BORDER),
    bottom=Side(style='thin', color=COLOR_STONE_BORDER)
)
border_total = Border(
    left=Side(style='thin', color=COLOR_STONE_BORDER),
    right=Side(style='thin', color=COLOR_STONE_BORDER),
    top=Side(style='thin', color='78716C'),
    bottom=Side(style='double', color='1C1917')
)

align_center = Alignment(horizontal='center', vertical='center')
align_left = Alignment(horizontal='left', vertical='center')
align_right = Alignment(horizontal='right', vertical='center')
align_wrap_left = Alignment(horizontal='left', vertical='center', wrap_text=True)

def auto_fit_columns(ws, min_widths=None):
    if min_widths is None:
        min_widths = {}
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            if cell.number_format and '%' in cell.number_format:
                val = "100.0%"
            lines = val.split('\n')
            for l in lines:
                if len(l) > max_len:
                    max_len = len(l)
        min_w = min_widths.get(col_letter, 12)
        ws.column_dimensions[col_letter].width = max(max_len + 4, min_w)


# ---------------------------------------------------------
# SHEET 1: 📊 Executive Summary & Analytics
# ---------------------------------------------------------
ws1 = wb.create_sheet(title='Executive Summary')
ws1.views.sheetView[0].showGridLines = True

# Title Block
ws1['B2'] = "PUFFS 'N' ROLLS — PRODUCT PHOTOS AUDIT & GAP REPORT"
ws1['B2'].font = font_title
ws1['B3'] = "Strict Matching Audit • Master Catalog (224 Products) vs Folder Photos ('/pnr product photos/')"
ws1['B3'].font = font_subtitle
ws1.row_dimensions[2].height = 24
ws1.row_dimensions[3].height = 18

# KPI Cards Block (Row 5 to 7)
kpi_data = [
    ('B', 'C', 'TOTAL CATALOG PRODUCTS', 224, font_title),
    ('D', 'E', 'PHOTOS WITH STRICT MATCH', 9, font_green_badge),
    ('F', 'G', 'MISSING DEDICATED PHOTOS', 215, font_red_badge),
    ('H', 'I', 'TOTAL PHOTOS IN FOLDER', 45, font_title),
    ('J', 'K', 'POTENTIAL QUICK WINS', 6, font_amber_badge),
]

for col1, col2, label, val, val_font in kpi_data:
    cell_label = f"{col1}5"
    cell_val = f"{col1}6"
    ws1.merge_cells(f"{col1}5:{col2}5")
    ws1.merge_cells(f"{col1}6:{col2}7")
    
    ws1[cell_label] = label
    ws1[cell_label].font = font_kpi_label
    ws1[cell_label].alignment = align_center
    ws1[cell_label].fill = fill_kpi
    
    ws1[cell_val] = val
    ws1[cell_val].font = font_kpi_num
    ws1[cell_val].alignment = align_center
    ws1[cell_val].fill = fill_kpi
    
    # Border for the KPI block
    for r in range(5, 8):
        for c_char in [col1, col2]:
            ws1[f"{c_char}{r}"].border = border_thin

ws1.row_dimensions[5].height = 18
ws1.row_dimensions[6].height = 20
ws1.row_dimensions[7].height = 20

# Section: Category Breakdown
ws1['B9'] = "CATEGORY-WISE PHOTO COVERAGE BREAKDOWN"
ws1['B9'].font = font_section
ws1.row_dimensions[9].height = 24

table_headers = [
    ("Sr No", 8),
    ("Category Name", 28),
    ("Total Products", 16),
    ("Photos Available", 18),
    ("Photos Missing", 16),
    ("Coverage %", 14),
    ("Status", 16),
    ("Action Priority", 24),
]

# Write Table Headers (Row 11)
start_row = 11
for col_idx, (th_text, _) in enumerate(table_headers, start=2):
    cell = ws1.cell(row=start_row, column=col_idx, value=th_text)
    cell.font = font_th
    cell.fill = fill_th_dark
    cell.alignment = align_center
    cell.border = border_thin
ws1.row_dimensions[start_row].height = 26

current_row = start_row + 1
for idx, cat in enumerate(categories_summary, start=1):
    fill = fill_alt if idx % 2 == 0 else fill_white
    
    status_text = "Good" if cat['pct_covered'] > 0.1 else ("Action Needed" if cat['pct_covered'] > 0 else "Urgent Action Required")
    priority_text = "Standard Pipeline" if cat['pct_covered'] > 0.1 else ("High Priority" if cat['pct_covered'] > 0 else "Highest Priority (0% Photos)")
    
    row_vals = [
        (idx, align_center, None),
        (cat['category'], align_left, None),
        (cat['total'], align_right, '#,##0'),
        (cat['covered'], align_right, '#,##0'),
        (cat['missing'], align_right, '#,##0'),
        (cat['pct_covered'], align_right, '0.0%'),
        (status_text, align_center, None),
        (priority_text, align_left, None)
    ]
    
    for col_idx, (val, aln, num_fmt) in enumerate(row_vals, start=2):
        cell = ws1.cell(row=current_row, column=col_idx, value=val)
        cell.font = font_cell_bold if col_idx == 3 else font_cell
        cell.alignment = aln
        cell.fill = fill
        cell.border = border_thin
        if num_fmt:
            cell.number_format = num_fmt
        
        # Color status badge
        if col_idx == 8: # Status
            if cat['pct_covered'] == 0:
                cell.fill = fill_red_badge
                cell.font = font_red_badge
            elif cat['pct_covered'] < 0.1:
                cell.fill = fill_amber_badge
                cell.font = font_amber_badge
            else:
                cell.fill = fill_green_badge
                cell.font = font_green_badge
                
    ws1.row_dimensions[current_row].height = 22
    current_row += 1

# Total Summary Row
total_row = current_row
ws1.cell(row=total_row, column=2, value="TOTAL").font = font_cell_bold
ws1.cell(row=total_row, column=3, value="All 7 Categories").font = font_cell_bold
ws1.cell(row=total_row, column=4, value="=SUM(D12:D18)").number_format = '#,##0'
ws1.cell(row=total_row, column=5, value="=SUM(E12:E18)").number_format = '#,##0'
ws1.cell(row=total_row, column=6, value="=SUM(F12:F18)").number_format = '#,##0'
ws1.cell(row=total_row, column=7, value="=E19/D19").number_format = '0.0%'
ws1.cell(row=total_row, column=8, value="OVERALL GAP").font = font_cell_bold
ws1.cell(row=total_row, column=9, value="215 Photos Needed").font = font_cell_bold

for c in range(2, 10):
    cell = ws1.cell(row=total_row, column=c)
    cell.font = font_cell_bold
    cell.fill = fill_total
    cell.border = border_total
    if c in [2, 8, 9]:
        cell.alignment = align_center
    elif c in [4, 5, 6, 7]:
        cell.alignment = align_right
    else:
        cell.alignment = align_left
ws1.row_dimensions[total_row].height = 24

# Rule Explanatory Card below
note_row = total_row + 3
ws1.cell(row=note_row, column=2, value="STRICT AUDIT RULE & ACTION GUIDE:").font = font_cell_bold
notes = [
    "1. Strict Matching Rule: A catalog item is only marked covered if a photo exists with the EXACT product title.",
    "2. Generic Covers: Photos like 'Calzone.jpeg' or 'croissant.jpeg' do NOT cover specific varieties like 'Veg Calzone' or 'Nutella Croissant'. Dedicated photos are needed.",
    "3. Quick Wins: 6 photos already exist in the folder that can immediately cover products if renamed to match the exact catalog title (see Sheet 4).",
    "4. WhatsApp Photos: 6 photos with WhatsApp timestamp filenames require manual visual identification before naming."
]
for idx, n in enumerate(notes, start=note_row+1):
    ws1.cell(row=idx, column=2, value=n).font = font_subtitle
    ws1.row_dimensions[idx].height = 18

auto_fit_columns(ws1, {
    'B': 10, 'C': 30, 'D': 18, 'E': 18, 'F': 18, 'G': 14, 'H': 18, 'I': 28, 'J': 14, 'K': 14
})


# ---------------------------------------------------------
# SHEET 2: ❌ Missing Photos Checklist (Actionable Master)
# ---------------------------------------------------------
ws2 = wb.create_sheet(title='Missing Photos Checklist')
ws2.views.sheetView[0].showGridLines = True
ws2.freeze_panes = 'A3'

# Table Header
headers_ws2 = [
    ("Sr No", 8),
    ("Category", 24),
    ("Product Name", 34),
    ("MRP (₹)", 12),
    ("Photo Status", 16),
    ("Quick Win / Action Suggestion", 42),
    ("Checklist", 14),
    ("Assigned Photo Filename", 32),
    ("Photographer / Notes", 24),
]

ws2['A1'] = "PRODUCTS MISSING DEDICATED PHOTOS — MASTER CHECKLIST (215 ITEMS)"
ws2['A1'].font = font_title
ws2.row_dimensions[1].height = 24

for col_idx, (th_text, _) in enumerate(headers_ws2, start=1):
    cell = ws2.cell(row=2, column=col_idx, value=th_text)
    cell.font = font_th
    cell.fill = fill_th_dark
    cell.alignment = align_center
    cell.border = border_thin
ws2.row_dimensions[2].height = 26

row_num = 3
for idx, item in enumerate(all_missing_items, start=1):
    fill = fill_alt if idx % 2 == 0 else fill_white
    
    # Check if quick win exists
    suggestion = quick_wins_lookup.get(item['name'], "📸 Fresh studio photo required")
    is_quick_win = "⚠️" in suggestion
    is_generic = "ℹ️" in suggestion
    
    # Price formatting
    price_val = item['price'].replace('₹', '').strip()
    try:
        price_num = float(price_val)
        price_disp = price_num
        price_fmt = '₹#,##0'
    except ValueError:
        price_disp = price_val
        price_fmt = None
    
    row_vals = [
        (idx, align_center, None),
        (item['category'], align_left, None),
        (item['name'], align_left, None),
        (price_disp, align_right if price_fmt else align_center, price_fmt),
        ("MISSING", align_center, None),
        (suggestion, align_left, None),
        ("[  ] Pending", align_center, None),
        ("", align_left, None),
        ("", align_left, None)
    ]
    
    for col_idx, (val, aln, num_fmt) in enumerate(row_vals, start=1):
        cell = ws2.cell(row=row_num, column=col_idx, value=val)
        cell.font = font_cell_bold if col_idx in [3] else font_cell
        cell.alignment = aln
        cell.fill = fill
        cell.border = border_thin
        if num_fmt:
            cell.number_format = num_fmt
            
        # Status Badge
        if col_idx == 5:
            cell.fill = fill_red_badge
            cell.font = font_red_badge
        
        # Suggestion formatting
        if col_idx == 6:
            if is_quick_win:
                cell.fill = fill_amber_badge
                cell.font = font_amber_badge
            elif is_generic:
                cell.fill = fill_sky_badge
                cell.font = font_sky_badge
                
    ws2.row_dimensions[row_num].height = 20
    row_num += 1

# Auto-filter on data
ws2.auto_filter.ref = f"A2:I{row_num - 1}"
auto_fit_columns(ws2, {
    'A': 8, 'B': 24, 'C': 34, 'D': 12, 'E': 16, 'F': 44, 'G': 14, 'H': 32, 'I': 24
})


# ---------------------------------------------------------
# SHEET 3: ✅ Confirmed Photo Matches (9 items)
# ---------------------------------------------------------
ws3 = wb.create_sheet(title='Confirmed Photo Matches')
ws3.views.sheetView[0].showGridLines = True
ws3.freeze_panes = 'A3'

ws3['A1'] = "PRODUCTS WITH CONFIRMED STRICT PHOTO MATCH (9 ITEMS)"
ws3['A1'].font = font_title
ws3.row_dimensions[1].height = 24

headers_ws3 = [
    ("Sr No", 8),
    ("Category", 22),
    ("Product Name", 28),
    ("MRP (₹)", 12),
    ("Matching Photo Filename", 34),
    ("Subfolder Path", 18),
    ("Match Quality", 22),
    ("Production Status", 18),
]

for col_idx, (th_text, _) in enumerate(headers_ws3, start=1):
    cell = ws3.cell(row=2, column=col_idx, value=th_text)
    cell.font = font_th
    cell.fill = fill_th_dark
    cell.alignment = align_center
    cell.border = border_thin
ws3.row_dimensions[2].height = 26

row_num = 3
for idx, item in enumerate(matched_items, start=1):
    fill = fill_alt if idx % 2 == 0 else fill_white
    
    price_val = item['price'].replace('₹', '').strip()
    try:
        price_disp = float(price_val)
        price_fmt = '₹#,##0'
    except ValueError:
        price_disp = price_val
        price_fmt = None
        
    subfolder = "ICECREAM/" if "ICECREAM/" in item['photo'] else ("SNACKS GENERAL/" if "SNACKS" in item['photo'] else "Root Directory")
    clean_photo = item['photo'].split('/')[-1]
    
    row_vals = [
        (idx, align_center, None),
        (item['category'], align_left, None),
        (item['name'], align_left, None),
        (price_disp, align_right if price_fmt else align_center, price_fmt),
        (clean_photo, align_left, None),
        (subfolder, align_center, None),
        ("Exact Strict Match", align_center, None),
        ("LIVE IN WEBSHOP", align_center, None)
    ]
    
    for col_idx, (val, aln, num_fmt) in enumerate(row_vals, start=1):
        cell = ws3.cell(row=row_num, column=col_idx, value=val)
        cell.font = font_cell_bold if col_idx in [3, 5] else font_cell
        cell.alignment = aln
        cell.fill = fill
        cell.border = border_thin
        if num_fmt:
            cell.number_format = num_fmt
        if col_idx in [7, 8]:
            cell.fill = fill_green_badge
            cell.font = font_green_badge
            
    ws3.row_dimensions[row_num].height = 22
    row_num += 1

ws3.auto_filter.ref = f"A2:H{row_num - 1}"
auto_fit_columns(ws3, {
    'A': 8, 'B': 22, 'C': 28, 'D': 12, 'E': 34, 'F': 18, 'G': 22, 'H': 18
})


# ---------------------------------------------------------
# SHEET 4: 📁 Unmatched Photos in Directory (37 items)
# ---------------------------------------------------------
ws4 = wb.create_sheet(title='Unmatched Photos in Folder')
ws4.views.sheetView[0].showGridLines = True
ws4.freeze_panes = 'A3'

ws4['A1'] = "PHOTOS IN DIRECTORY NOT STRICTLY MATCHED TO MASTER CATALOG (37 PHOTOS)"
ws4['A1'].font = font_title
ws4.row_dimensions[1].height = 24

headers_ws4 = [
    ("Sr No", 8),
    ("Classification Group", 28),
    ("Photo Filename", 34),
    ("Subfolder", 18),
    ("Suggested Target Product / Menu", 36),
    ("Action Required", 38),
    ("Urgency / Quick Win", 22)
]

for col_idx, (th_text, _) in enumerate(headers_ws4, start=1):
    cell = ws4.cell(row=2, column=col_idx, value=th_text)
    cell.font = font_th
    cell.fill = fill_th_dark
    cell.alignment = align_center
    cell.border = border_thin
ws4.row_dimensions[2].height = 26

row_num = 3
for idx, item in enumerate(unmatched_items, start=1):
    fill = fill_alt if idx % 2 == 0 else fill_white
    
    row_vals = [
        (idx, align_center),
        (item['group'], align_left),
        (item['photo'], align_left),
        (item['folder'], align_center),
        (item['target'], align_left),
        (item['action'], align_left),
        (item['urgency'], align_center)
    ]
    
    for col_idx, (val, aln) in enumerate(row_vals, start=1):
        cell = ws4.cell(row=row_num, column=col_idx, value=val)
        cell.font = font_cell_bold if col_idx in [3] else font_cell
        cell.alignment = aln
        cell.fill = fill
        cell.border = border_thin
        
        # Color badge for urgency
        if col_idx == 7:
            if "Quick Win" in val:
                cell.fill = fill_amber_badge
                cell.font = font_amber_badge
            elif "Generic" in val:
                cell.fill = fill_sky_badge
                cell.font = font_sky_badge
            elif "Inspection" in val:
                cell.fill = fill_red_badge
                cell.font = font_red_badge
            else:
                cell.fill = fill_kpi
                cell.font = font_cell_bold
                
    ws4.row_dimensions[row_num].height = 22
    row_num += 1

ws4.auto_filter.ref = f"A2:G{row_num - 1}"
auto_fit_columns(ws4, {
    'A': 8, 'B': 28, 'C': 34, 'D': 18, 'E': 36, 'F': 38, 'G': 22
})


# ---------------------------------------------------------
# SHEET 5: 🗂️ Complete Catalog (224 Products)
# ---------------------------------------------------------
ws5 = wb.create_sheet(title='Master Catalog (All 224)')
ws5.views.sheetView[0].showGridLines = True
ws5.freeze_panes = 'A3'

ws5['A1'] = "PUFFS 'N' ROLLS COMPLETE MASTER CATALOG AUDIT STATUS (ALL 224 PRODUCTS)"
ws5['A1'].font = font_title
ws5.row_dimensions[1].height = 24

headers_ws5 = [
    ("Sr No", 8),
    ("Category", 24),
    ("Product Name", 34),
    ("MRP (₹)", 12),
    ("Photo Status", 16),
    ("Matched Photo Filename", 34),
    ("Production Readiness", 20)
]

for col_idx, (th_text, _) in enumerate(headers_ws5, start=1):
    cell = ws5.cell(row=2, column=col_idx, value=th_text)
    cell.font = font_th
    cell.fill = fill_th_dark
    cell.alignment = align_center
    cell.border = border_thin
ws5.row_dimensions[2].height = 26

# Compile full catalog: 9 matched + 215 missing
matched_dict = {m['name']: m['photo'] for m in matched_items}

# Combine and group by category
full_catalog = []
for cat in categories_summary:
    # First find matched in this category
    cat_matched = [m for m in matched_items if m['category'] == cat['category']]
    for m in cat_matched:
        full_catalog.append({
            'category': cat['category'],
            'name': m['name'],
            'price': m['price'],
            'status': 'COVERED',
            'photo': m['photo'],
            'readiness': 'READY'
        })
    # Then missing items
    for item in cat['items']:
        full_catalog.append({
            'category': cat['category'],
            'name': item['name'],
            'price': item['price'],
            'status': 'MISSING',
            'photo': quick_wins_lookup.get(item['name'], '—'),
            'readiness': 'ACTION REQUIRED'
        })

row_num = 3
for idx, prod in enumerate(full_catalog, start=1):
    fill = fill_alt if idx % 2 == 0 else fill_white
    
    price_val = str(prod['price']).replace('₹', '').strip()
    try:
        price_disp = float(price_val)
        price_fmt = '₹#,##0'
    except ValueError:
        price_disp = price_val
        price_fmt = None
        
    row_vals = [
        (idx, align_center, None),
        (prod['category'], align_left, None),
        (prod['name'], align_left, None),
        (price_disp, align_right if price_fmt else align_center, price_fmt),
        (prod['status'], align_center, None),
        (prod['photo'], align_left, None),
        (prod['readiness'], align_center, None)
    ]
    
    for col_idx, (val, aln, num_fmt) in enumerate(row_vals, start=1):
        cell = ws5.cell(row=row_num, column=col_idx, value=val)
        cell.font = font_cell_bold if col_idx == 3 else font_cell
        cell.alignment = aln
        cell.fill = fill
        cell.border = border_thin
        if num_fmt:
            cell.number_format = num_fmt
            
        if col_idx == 5: # Status
            if prod['status'] == 'COVERED':
                cell.fill = fill_green_badge
                cell.font = font_green_badge
            else:
                cell.fill = fill_red_badge
                cell.font = font_red_badge
        elif col_idx == 7: # Readiness
            if prod['readiness'] == 'READY':
                cell.fill = fill_green_badge
                cell.font = font_green_badge
            else:
                cell.fill = fill_amber_badge
                cell.font = font_amber_badge
                
    ws5.row_dimensions[row_num].height = 20
    row_num += 1

ws5.auto_filter.ref = f"A2:G{row_num - 1}"
auto_fit_columns(ws5, {
    'A': 8, 'B': 24, 'C': 34, 'D': 12, 'E': 16, 'F': 36, 'G': 20
})

# Save workbook
wb.save(out_xlsx_path)
print(f"✅ Excel workbook saved successfully to: {out_xlsx_path}")
print(f"   Total sheets: {len(wb.sheetnames)}")
print(f"   Sheets: {wb.sheetnames}")
