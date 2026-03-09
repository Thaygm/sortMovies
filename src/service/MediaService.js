export class MediaService {
    async getMedia() {
        const response = await fetch('./data/media.json'); 
        return await response.json();
    }

    async getMediaById(id) {
        const mediaList = await this.getMedia();
        return mediaList.find(item => item.id === id);
    }

    async getMediaByIds(ids) {
        const mediaList = await this.getMedia();
        return mediaList.filter(item => ids.includes(item.id));
    }
}