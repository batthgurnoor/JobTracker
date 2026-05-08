const pageInfo = {
  title: document.title,
  url: window.location.href
};

// This log is useful in development to verify the content script
// can access the current page metadata in real browsing contexts.
console.debug("Job Tracker content script loaded:", pageInfo);
