import axios from 'axios'

export async function fetchGitHubFilesRecursively (
  repository: string,
  path: string
): Promise<Array<({ fileName: any, content: any, path: any } | null)>> {
  const apiUrl = `https://api.github.com/repos/${repository}/contents/${path}`

  try {
    const response = await axios.get(apiUrl)
    if (Array.isArray(response.data)) {
      const files = response.data.filter((item) => item.type === 'file')
      const fileContents = await Promise.all(
        files.map(async (file) => {
          if (file.type === 'file') {
            const fileResponse = await axios.get(file.download_url)
            return {
              path,
              fileName: file.name,
              content: fileResponse.data
            }
          }
          return null
        })
      )

      const subDirectories = response.data.filter((item) => item.type === 'dir')
      const subDirectoryContents = await Promise.all(
        subDirectories.map(async (dir) => {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          const subPath = `${path}/${dir.name}`
          return await fetchGitHubFilesRecursively(repository, subPath)
        })
      )

      return fileContents
        .filter((content) => content !== null)
        .concat(...subDirectoryContents)
    } else {
      throw new Error('Failed to fetch directory.')
    }
  } catch (error) {
    throw new Error('Error fetching directory')
  }
}
