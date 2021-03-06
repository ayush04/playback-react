import { Song } from "../models/song";
import { AppEvent } from './event';
import { StorageService } from './storage';
import { Playlist } from "./playlist";

export class Queue {
    private static _queue: Array<Song>;
    private static _currentTrack = -1;

    static initalize = () => {
        Queue._queue = Queue._fetchPreviousQueue();
    }
    private static _fetchPreviousQueue = (): any => {
        const value = StorageService.get('CURRENT_QUEUE');
        const _tempQueue = new Array<Song>();
        if (value) {
            value.forEach((item: any) => {
                _tempQueue.push(new Song(item.id, item.title, item.description, item.artistName, item.thumbnail, item.videoId));
            });
        }
        return _tempQueue;
    }
    static queue = (song: Song): void => {
        Queue._queue.push(song);
        Playlist.addSongToPlaylist(song.getId());
        StorageService.save('CURRENT_QUEUE', Queue._queue);
        AppEvent.emit('queue-updated');
    }

    static dequeue = (): Song | undefined => {
        const song = Queue._queue.shift();
        AppEvent.emit('queue-updated');
        StorageService.save('CURRENT_QUEUE', Queue._queue);
        return song;
    }

    static next = (): Song | undefined => {
        if (Queue._queue[Queue._currentTrack + 1]) {
            return Queue._queue[++Queue._currentTrack];
        }
        return undefined;
    }

    static getNextTrack = (): Song | undefined => {
        if (Queue._queue[Queue._currentTrack + 1]) {
            return Queue._queue[Queue._currentTrack + 1];
        }
        return undefined;
    }

    static previous = (): Song | undefined => {
        if (Queue._queue[Queue._currentTrack - 1]) {
            return Queue._queue[--Queue._currentTrack];
        }
        return undefined;
    }

    static getCurrentQueue = (): Array<Song> => {
        return Queue._queue;
    }

    static getCurrentSongIds = (): Array<String> => {
        return Queue._queue.map(song => song.getId());
    }

    static updateCurrentPlayingTrack = (trackId: string): void => {
        Queue._currentTrack = Queue._queue.findIndex(song => song.getVideoId() === trackId);
    }

    static getSongFromTrackId = (trackId: string): Song => {
        const song = Queue._queue.filter(song => song.getVideoId() === trackId);
        return song[0];
    }

    static deleteTrack = (videoId: string): Promise<any> => {
        const pos = Queue._queue.findIndex(song => song.getVideoId() === videoId);
        const song = Queue._queue[pos];
        Queue._queue.splice(pos, 1);
        return Playlist.removeSongFromPlaylist(song.getId()).then(() => {
            StorageService.save('CURRENT_QUEUE', Queue._queue);
        });
    }
}