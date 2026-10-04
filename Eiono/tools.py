from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()
from rich import print
tavily=TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
@tool
def web_search(query:str)->str:
    """"Search the Web for recent and reliable information on a topic. Returns Titles, URLs and Snippets."""
    results= tavily.search(query=query,max_results=5)
    out=[]

    for r in results['results']:
        out.append(
            f"Title: {r['title']}\n"
            f"URL: {r['url']}\n"
            f"Snippet: {r['content'][:300]}\n"
            )

    return "\n----\n".join(out)

#print(web_search.invoke("War in Middle East"))

@tool
def scrape_url(url:str)->str:
    """Scrape and return clean Text content from a given URL for Deeper reading"""
    try:
        resp=requests.get(url,timeout=8,headers={"User-Agent":"Mozilla/5.0" })
        soup=BeautifulSoup(resp.text,"html.parser")
        for tag in soup(["script","style","nav","footer"]):
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)[:3000]
    except Exception as e:
        return f"Could Not find source Url:{str(e)}"

print(scrape_url.invoke("https://www.thehindu.com/news/national/ec-dissent-gyanesh-kumar-resignation-row-september-24-2026-live-updates/article71502728.ece"))