import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict, List, Any
import asyncio

def find_reagents_from_rows(rows) -> List[Dict[str, Any]]:
    reagents = []
    for row in rows:
        # Extract icon URL from background-image
        icon_div = row.select_one('div.iconsmall ins')
        icon_url = None
        if icon_div and 'background-image' in icon_div.attrs.get('style', ''):
            icon_url = icon_div['style'].split('url("')[-1].split('")')[0]

        # Extract quantity from data attribute or span
        quantity = int(row.get('data-icon-list-quantity', 1))
        
        # Extract name and quality class
        name_link = row.find('a', class_=['q1', 'q2', 'q3', 'q4'])
        if not name_link:
            continue
        
        name = name_link.text.strip()
        
        reagents.append({
            'name': name,
            'quantity': quantity,
            'icon_url': icon_url
        })
    
    return reagents

async def parse_wowhead_enchant(url: str) -> Optional[Dict[str, Any]]:
    try:
        response = await asyncio.to_thread(requests.get, url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract enchant name
        title_tag = soup.find('h1', {'class': 'heading-size-1'})
        if not title_tag:
            return None
        title = title_tag.get_text(strip=True)
        name_parts = [part.strip() for part in title.split('-', 1)]
        if len(name_parts) == 1:
            name_parts.append('')

        # Try first structure: rows with style not display:none
        reagent_rows = soup.select('tr[id^="icon-list-reagents"]:not([style*="display:none"])')
        
        # If first structure yields no results, try alternative structure
        if not reagent_rows:
            # Look for the reagents heading and table
            reagents_heading = soup.find('h2', id='icon-list-heading-reagents')
            if reagents_heading:
                # Find the next table with class icon-list
                icon_list_table = reagents_heading.find_next('table', class_='icon-list')
                if icon_list_table:
                    reagent_rows = icon_list_table.select('tr[data-icon-list-quantity]')

        reagents = find_reagents_from_rows(reagent_rows)
        
        if not reagents:
            print(f'No reagents found for {url}')
            return None

        return {
            'name_parts': name_parts,
            'reagents': reagents
        }
    except Exception as e:
        print(f'Error parsing enchant: {e}')
        return None