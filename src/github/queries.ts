// Fetches up to 15 merged PRs per page, with nested files, reviews, and comments.
// One round-trip replaces ~4 REST calls per PR.
export const PR_SEARCH_QUERY = `
  query SearchMergedPRs($query: String!, $cursor: String) {
    search(query: $query, type: ISSUE, first: 15, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          number
          title
          mergedAt
          additions
          deletions
          changedFiles
          author {
            __typename
            login
          }
          files(first: 100) {
            nodes {
              path
            }
          }
          reviews(first: 30) {
            nodes {
              author {
                __typename
                login
              }
              state
              body
              submittedAt
              comments(first: 20) {
                nodes {
                  body
                  path
                  author {
                    __typename
                    login
                  }
                }
              }
            }
          }
          comments(first: 30) {
            nodes {
              author {
                __typename
                login
              }
              body
              createdAt
            }
          }
        }
      }
    }
  }
`;
