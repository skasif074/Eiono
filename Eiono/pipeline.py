from agents import build_reader_agent, build_search_agent, writer_chain, critic_chain

LINE = "=" * 50
READER_INPUT_LIMIT = 800


def log(title: str, body: str | None = None) -> None:
    """Print a step header (and optional body) to the server console."""
    print(f"\n{LINE}\n{title}\n{LINE}")
    if body is not None:
        print(body)


def trim_at_line(text: str, limit: int) -> str:
    """Cut text to roughly `limit` chars without slicing a line (or URL) in half."""
    if len(text) <= limit:
        return text
    cut = text[:limit]
    last_newline = cut.rfind("\n")
    return cut[:last_newline] if last_newline > 0 else cut


def run_research_pipeline(topic: str) -> dict:
    state = {}
    log("Eiono started execution")

    # Step 1: search agent
    log("Step 1 - Searching the web...")
    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [
            ("user", f"Find recent, reliable and detailed information about: {topic}")
        ]
    })
    state["search_results"] = search_result["messages"][-1].content
    print(state["search_results"])

    # Step 2: reader agent
    log("Step 2 - Fetching the top resource...")
    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [
            (
                "user",
                f"Based on the following search results about '{topic}', "
                f"pick the most relevant URL and scrape it for deeper content.\n\n"
                f"Search Results:\n{trim_at_line(state['search_results'], READER_INPUT_LIMIT)}",
            )
        ]
    })
    state["scraped_content"] = reader_result["messages"][-1].content
    print(state["scraped_content"])

    # Step 3: writer chain
    log("Step 3 - Writer is drafting the report...")
    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
    )
    state["report"] = writer_chain.invoke({
        "topic": topic,
        "research": research_combined,
    })
    print(state["report"])

    # Step 4: critic chain
    log("Step 4 - Critic is reviewing the report...")
    state["feedback"] = critic_chain.invoke({"report": state["report"]})
    print(state["feedback"])

    log("Done")
    return state


if __name__ == "__main__":
    topic = input("\nEnter a research topic: ")
    result = run_research_pipeline(topic)