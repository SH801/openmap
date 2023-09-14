"""
Copyright (c) Positive Farms, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/functions.py
Shared functions
"""

from html.parser import HTMLParser

def usewebsiteshortcode(url):
    """
    Checks whether website can be used to create shortcode
    """

    url = url.strip().lower()
    if url == '': return False
    if "facebook.com" in url: return False
    if "twitter.com" in url: return False

    return True

class HTMLTagRemover(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []

    def handle_data(self, data):
        self.result.append(data)

    def get_text(self):
        return ''.join(self.result)

def remove_html_tags(text):
    remover = HTMLTagRemover()
    remover.feed(text)
    return remover.get_text()

def format_address(address, postcode):
    address = address.replace(" ,", ",").strip()
    address = address.replace(", ", ",")
    address = address.replace("\n", ",")
    address = address.replace("\r", ",")
    address = address.replace(",,", ",")
    address = address.replace(",", ", ").strip()
    address += " " + postcode
    return address    
