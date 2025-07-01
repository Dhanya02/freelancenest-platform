from typing import Dict, List, Any, Optional
import asyncio
from pydantic import BaseModel, Field
import requests
from bs4 import BeautifulSoup
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

class BlogContentResponse(BaseModel):
    """Model for blog content quality analysis response"""
    overall_score: float = Field(description="Overall quality score from 1-10")
    clarity_score: float = Field(description="Score for clarity and readability from 1-10")
    engagement_score: float = Field(description="Score for engagement and interest level from 1-10")
    structure_score: float = Field(description="Score for logical structure and flow from 1-10")
    seo_score: float = Field(description="Score for SEO optimization from 1-10")
    writing_style_assessment: str = Field(description="Assessment of writing style and tone")
    strengths: List[str] = Field(description="List of content strengths")
    weaknesses: List[str] = Field(description="List of content weaknesses")
    improvement_suggestions: List[str] = Field(description="Specific suggestions for improvement")

async def fetch_blog_content(url: str) -> Optional[str]:
    """Fetch content from a blog URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script, style, and navigation elements
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
            element.decompose()
        
        # Extract main content (you may need to adjust selectors for different blogs)
        article = soup.find('article') or soup.find(class_='post') or soup.find(class_='entry') or soup.find(class_='content')
        
        if article:
            # Get all paragraphs from the article
            content = article.get_text(separator='\n\n')
        else:
            # Fallback to body content, focusing on paragraphs
            paragraphs = soup.find_all('p')
            content = '\n\n'.join(p.get_text() for p in paragraphs)
        
        # Clean up whitespace
        content = '\n'.join(line.strip() for line in content.splitlines() if line.strip())
        return content
    
    except Exception as e:
        print(f"Error fetching blog content: {e}")
        return None

async def analyze_blog_chunk(chunk: str, chunk_index: int, total_chunks: int) -> Dict[str, Any]:
    """Analyze a chunk of blog content"""
    model = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.5,
        api_key=os.getenv('OPENAI_API_KEY'),
    )
    
    prompt = """
    You are an expert content quality analyst specializing in blog content assessment.
    
    Analyze the following blog content excerpt (chunk {chunk_index} of {total_chunks}) based on:
    
    1. Clarity and readability
    2. Engagement and interest level
    3. Logical structure and flow
    4. SEO optimization
    5. Writing style and tone
    
    For this excerpt, provide:
    - Content quality scores in each dimension (1-10 scale)
    - Analysis of strengths and weaknesses
    - Specific improvement suggestions
    
    Remember: You are only analyzing ONE CHUNK of the full blog post, so focus on evaluating
    what you can see in this excerpt without making assumptions about missing content.
    
    Blog Content Excerpt:
    {chunk}
    """
    
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", prompt)
    ])
    
    try:
        client = prompt_template | model.with_structured_output(BlogContentResponse)
        result = await asyncio.to_thread(
            client.invoke, 
            {"chunk": chunk, "chunk_index": chunk_index, "total_chunks": total_chunks}
        )
        return result
    except Exception as e:
        print(f"Error analyzing blog chunk {chunk_index}: {e}")
        return None

async def analyze_blog_content(content: str) -> BlogContentResponse:
    """Analyze the full blog content by processing in chunks and aggregating results"""
    # Split into manageable chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=4000,
        chunk_overlap=200,
        length_function=lambda txt: len(txt.split())
    )
    chunks = text_splitter.split_text(content)
    
    if not chunks:
        raise ValueError("No content available for analysis after chunking.")
    
    total_chunks = len(chunks)
    
    # Create asynchronous tasks for each chunk analysis
    tasks = [
        analyze_blog_chunk(chunk, i + 1, total_chunks)
        for i, chunk in enumerate(chunks)
    ]
    
    # Run analyses concurrently
    results = await asyncio.gather(*tasks)
    results = [res for res in results if res is not None]
    
    if not results:
        raise ValueError("Analysis failed for all content chunks.")
    
    # Aggregate scores and insights
    overall_score = sum(res.overall_score for res in results) / len(results)
    clarity_score = sum(res.clarity_score for res in results) / len(results)
    engagement_score = sum(res.engagement_score for res in results) / len(results)
    structure_score = sum(res.structure_score for res in results) / len(results)
    seo_score = sum(res.seo_score for res in results) / len(results)
    
    # Compile unique insights
    all_strengths = []
    all_weaknesses = []
    all_improvements = []
    writing_style_notes = []
    
    for res in results:
        all_strengths.extend(res.strengths)
        all_weaknesses.extend(res.weaknesses)
        all_improvements.extend(res.improvement_suggestions)
        writing_style_notes.append(res.writing_style_assessment)
    
    # Remove duplicates and limit to most significant insights
    unique_strengths = list(set(all_strengths))[:5]
    unique_weaknesses = list(set(all_weaknesses))[:5]
    unique_improvements = list(set(all_improvements))[:5]
    
    # Synthesize writing style assessment
    combined_writing_style = "\n".join(writing_style_notes)
    
    return BlogContentResponse(
        overall_score=overall_score,
        clarity_score=clarity_score,
        engagement_score=engagement_score,
        structure_score=structure_score,
        seo_score=seo_score,
        writing_style_assessment=combined_writing_style,
        strengths=unique_strengths,
        weaknesses=unique_weaknesses,
        improvement_suggestions=unique_improvements
    )