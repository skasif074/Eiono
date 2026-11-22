
import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from tools import web_search, scrape_url

load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY is missing from .env")

llm = ChatGroq(
    model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
    temperature=0,
    max_retries=3,
    timeout=120,
    max_tokens=4096
)


def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
        system_prompt=(
            "You are an expert research search agent. "
            "Search the web for reliable, relevant, and recent "
            "information. Collect factual evidence and source URLs. "
            "Never fabricate sources."
        )
    )


def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[scrape_url],
        system_prompt=(
            "You are an expert research reading agent. "
            "Read and analyze webpage content carefully. "
            "Extract important facts, statistics, and findings. "
            "Preserve source URLs and avoid unsupported claims."
        )
    )


writer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert research writer. "
        "Write clear, structured, factual, and insightful reports. "
        "Use only the supplied research evidence. "
        "Do not invent citations or unsupported facts."
    ),
    (
        "human",
        """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:

1. Introduction
2. Key Findings (minimum 3 well-explained points)
3. Conclusion
4. Sources (list all URLs found in the research)

Be detailed, factual, and professional.
If evidence is insufficient, clearly state the limitations."""
    )
])

writer_chain = writer_prompt | llm | StrOutputParser()


critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a sharp and constructive research critic. "
        "Be honest, objective, and specific. "
        "Evaluate factual grounding, clarity, completeness, "
        "source quality, and logical consistency."
    ),
    (
        "human",
        """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""
    )
])

critic_chain = critic_prompt | llm | StrOutputParser()
