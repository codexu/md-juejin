import fs from 'fs/promises'

export type ImageInfo = {
  src: string
  fileName: string
}

export default async function saveImages(images: ImageInfo[], outputDir: string) {
  for (const image of images) {
    const file = await (await fetch(image.src)).arrayBuffer()
    await fs.writeFile(`${outputDir}/${image.fileName}`, Buffer.from(file))
  }
}