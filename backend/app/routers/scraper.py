"""
Scraper API Router - Extracts interview problems from URLs
"""

from fastapi import APIRouter, HTTPException
import httpx
from bs4 import BeautifulSoup
from typing import List
import os
import json
from openai import OpenAI

from app.models.schemas import ScrapeRequest, ScrapeResponse, Problem

router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def fetch_page_content(url: str) -> str:
    """Fetch the HTML content of a URL."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(url, headers=headers, timeout=30.0, follow_redirects=True)
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching URL: {str(e)}")


def extract_text_from_html(html: str) -> str:
    """Extract readable text from HTML content."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()
    
    # Get text
    text = soup.get_text(separator="\n", strip=True)
    
    # Clean up whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = "\n".join(chunk for chunk in chunks if chunk)
    
    # Limit text length for API
    return text[:15000]


async def extract_problems_with_ai(text: str, url: str) -> List[Problem]:
    """Use OpenAI to extract structured problem information from text."""
    
    prompt = f"""Analyze the following text from a webpage and extract any interview problems, coding challenges, or practice questions.

For each problem found, extract:
1. name: The title or name of the problem
2. content: The full problem description/statement
3. difficulty: If mentioned (easy/medium/hard), otherwise null

Return the results as a JSON array of objects with keys: name, content, difficulty.
If no problems are found, return an empty array.

Text from {url}:
---
{text}
---

Return ONLY valid JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that extracts structured data from text. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=2000
        )
        
        result = json.loads(response.choices[0].message.content)
        
        problems = []
        for item in result:
            problems.append(Problem(
                name=item.get("name", "Unnamed Problem"),
                content=item.get("content", ""),
                difficulty=item.get("difficulty")
            ))
        
        return problems
        
    except json.JSONDecodeError:
        # If JSON parsing fails, try to create a single problem from the content
        return [Problem(
            name="Extracted Content",
            content=text[:2000],
            difficulty=None
        )]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI extraction error: {str(e)}")


@router.post("/extract", response_model=ScrapeResponse)
async def extract_problems(request: ScrapeRequest):
    """
    Scrape a URL and extract interview problems using AI.
    """
    # Fetch page content
    html = await fetch_page_content(request.url)
    
    # Extract text
    text = extract_text_from_html(html)
    
    if not text:
        raise HTTPException(status_code=400, detail="No readable content found on the page")
    
    # Use AI to extract problems
    problems = await extract_problems_with_ai(text, request.url)
    
    if not problems:
        # Return the extracted text as a single problem if no structured problems found
        problems = [Problem(
            name="Page Content",
            content=text[:3000],
            difficulty=None
        )]
    
    return ScrapeResponse(
        problems=problems,
        source_url=request.url
    )


@router.post("/preview")
async def preview_url(request: ScrapeRequest):
    """
    Preview the extracted text from a URL without AI processing.
    Useful for debugging and verification.
    """
    html = await fetch_page_content(request.url)
    text = extract_text_from_html(html)
    
    return {
        "url": request.url,
        "text_length": len(text),
        "preview": text[:1000],
        "full_text": text
    }
