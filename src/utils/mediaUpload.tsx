/* eslint-disable no-await-in-loop */
import ReactS3Client from 'react-aws-s3-typescript';
import MessagesModel from 'firestore/messagesModel';
import { Room, UpdateRoom } from 'interfaces/firestore';
// import { sendNotification } from 'utils/notifications';
import RoomModel from 'firestore/roomModel';
import placeholderImage from 'assets/images/image-placeholder.svg';

const s3Config = {
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || '',
  dirName: 'Avatus',
  region: 'us-east-1' || '',
  accessKeyId: process.env.REACT_APP_S3_BUCKET_ACCESS_KEY || '',
  secretAccessKey: process.env.REACT_APP_S3_BUCKET_SECRET_ACCESS_KEY || '',
  s3Url: process.env.REACT_APP_S3_BUCKET_URL || '',
};

const mediaUploader = async (files: File[], data: { roomId: string, receiverId: string, senderId: string, senderName: string, senderImageURL?: string, unreadCount: number, documentExists: boolean, }, thumbnail?: File, deviceTokens?: { [deviceToken: string]: string; }, isGroup = false, roomDataMain?: null | Room) => {
  if (files && files.length > 0) {
    try {
      const promises: Promise<string>[] = [];
      const s3 = new ReactS3Client(s3Config);
      const MessagesModelObject = new MessagesModel();
      const roomModelObject = new RoomModel();

      let unreadCountLocal = data.unreadCount ?? 0;

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const fileName = `${+new Date()}_${file.name}`;
        const thumbnailName = thumbnail ? `${+new Date()}_${thumbnail.name}` : '';

        const fileNameWithoutSpecialChars = fileName.replace(
          /[`~!@#$%^&*()_|+\-=?;:\s'",.<>\\{\\}\\[\]\\\\/]/gi,
          '',
        );
        const thumbnailNameWithoutSpecialChars = thumbnailName.replace(
          /[`~!@#$%^&*()_|+\-=?;:\s'",.<>\\{\\}\\[\]\\\\/]/gi,
          '',
        );

        const localUrl = thumbnail ? URL.createObjectURL(thumbnail) : URL.createObjectURL(file);

        const messageData = {
          deleteFor: {},
          mediaUrl: '',
          messageRoomId: data.roomId,
          receiverId: data.receiverId,
          replyingTo: '',
          senderId: data.senderId,
          senderImageURL: '',
          senderName: data.senderName,
          forwarded: false,
          status: 'sent',
          text: '',
          thumbnail: '',
          timestamp: `${+new Date()}`,
          localMedia: localUrl,
          type: thumbnail ? 'video' : 'image',
        };
        const messageId = await MessagesModelObject.addMessage(data.roomId, messageData, data.documentExists, 0, false);
        unreadCountLocal += 1;
        const personalCount = unreadCountLocal;
        const {
          receiverId, roomId, senderName, senderImageURL,
        } = data;
        const roomData: UpdateRoom = {
          lastMessage: messageData,
          chatLastUpdate: `${+new Date()}`,
        };
        const chatRoomMembersData = roomDataMain && roomDataMain.chatRoomMembers ? Object.values(roomDataMain?.chatRoomMembers) : null;

        if (file.name.match(/.(jpg|jpeg|png|mp4|3gpp|quicktime|x-m4v)$/i) || file.type.match(/.(jpg|jpeg|png|mp4|3gpp|quicktime|x-m4v)$/i)) {
          promises.push(new Promise((resolve, reject) => {
            s3.uploadFile(thumbnail || file, thumbnail ? thumbnailNameWithoutSpecialChars : fileNameWithoutSpecialChars)
              .then((response: any) => {
                if (thumbnail) {
                  s3.uploadFile(file, fileNameWithoutSpecialChars)
                    .then((resp: any) => {
                      MessagesModelObject.updateMessage(roomId, messageId, { localMedia: '', mediaUrl: resp.location, thumbnail: response.location });
                      MessagesModelObject.addMedia(roomId, messageId, {
                        ...messageData, messageId, localMedia: '', mediaUrl: resp.location, thumbnail: response.location,
                      });
                      if (deviceTokens) {
                        // const tokens = Object.keys(deviceTokens);
                        // const notificationData : NotificationMain = {
                        //   title: senderName ?? 'Video Received',
                        //   content: 'sent a video',
                        //   chatData: { ...messageData, messageId },
                        //   image: response.location,
                        //   devices: [],
                        // };
                        // tokens.forEach((token: string) => {
                        //   if (token && (deviceTokens[token] === '1' || deviceTokens[token] === '2' || deviceTokens[token] === '3')) {
                        //     notificationData.devices.push({ deviceToken: token, deviceType: deviceTokens[token] });
                        //   }
                        // });
                        // if (notificationData.devices.length > 0) {
                        //   sendNotification(notificationData);
                        // }
                      }
                      if (!isGroup && receiverId && roomId) {
                        roomData.chatRoomMembers = {
                          [receiverId]: {
                            unreadCount: personalCount + 1,
                          },
                        };
                      } else if (isGroup && roomId && chatRoomMembersData) {
                        roomData.chatRoomMembers = {};
                        chatRoomMembersData.forEach((member) => {
                          if (member.memberId && member.memberId !== messageData.senderId && roomData.chatRoomMembers) {
                            roomData.chatRoomMembers[member.memberId] = {
                              unreadCount: member.unreadCount ? member.unreadCount + 1 : 1,
                            };
                          }
                        });
                      }
                      roomModelObject.updateRoom(roomId, roomData);
                      resolve(JSON.stringify({ [messageId]: response }));
                    });
                } else {
                  MessagesModelObject.updateMessage(roomId, messageId, { localMedia: '', mediaUrl: response.location });
                  MessagesModelObject.addMedia(roomId, messageId, {
                    ...messageData, messageId, localMedia: '', mediaUrl: response.location,
                  });
                  if (deviceTokens) {
                    // const tokens = Object.keys(deviceTokens);
                    // const notificationData : NotificationMain = {
                    //   title: senderName ?? 'Image Received',
                    //   content: 'sent an photo',
                    //   chatData: { ...messageData, messageId },
                    //   image: response.location,
                    //   devices: [],
                    // };
                    // tokens.forEach((token: string) => {
                    //   if (token && (deviceTokens[token] === '1' || deviceTokens[token] === '2' || deviceTokens[token] === '3')) {
                    //     notificationData.devices.push({ deviceToken: token, deviceType: deviceTokens[token] });
                    //   }
                    // });
                    // if (notificationData.devices.length > 0) {
                    //   sendNotification(notificationData);
                    // }
                  }
                  if (!isGroup && receiverId && roomId) {
                    roomData.chatRoomMembers = {
                      [receiverId]: {
                        unreadCount: personalCount + 1,
                      },
                    };
                  } else if (isGroup && roomId && chatRoomMembersData) {
                    roomData.chatRoomMembers = {};
                    chatRoomMembersData.forEach((member) => {
                      if (member.memberId && member.memberId !== messageData.senderId && roomData.chatRoomMembers) {
                        roomData.chatRoomMembers[member.memberId] = {
                          unreadCount: member.unreadCount ? member.unreadCount + 1 : 1,
                        };
                      }
                    });
                  }
                  roomModelObject.updateRoom(roomId, roomData);
                  resolve(JSON.stringify({ [messageId]: response }));
                }
              })
              .catch((error: any) => {
                reject(error);
              });
          }));
        }
      }
      Promise.all(promises).then((responses: any) => {
        //
        if (responses && responses.length > 0) {
          responses.forEach(() => {
            // messageObjectModel.updateMessage(data.roomId, selectedMessage.messageId, {localMedia: '', thumbnail: ''});
          });
        }
      });
    } catch (err: any) {
      //
    }
  }
};

const getTempThumbnail = (resolve: (value: File | PromiseLike<File>) => void, fileName: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  // draw the video frame to canvas
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = new Image();
    img.src = placeholderImage;
    ctx.drawImage(img, 0, 0, 40, 40);
    ctx.canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], fileName, {
            type: 'image/jpeg',
          }));
        }
      },
      'image/jpeg',
      0.75, /* quality */
    );
  }
};
const getVideoCover = (file: File, seekTo = 0.0): Promise<File> => new Promise((resolve, reject) => {
  // load the file to a video player
  const videoPlayer = document.createElement('video');
  videoPlayer.setAttribute('src', URL.createObjectURL(file));
  videoPlayer.load();
  videoPlayer.addEventListener('error', () => {
    getTempThumbnail(resolve, file.name);
  });
  // load metadata of the video to get video duration and dimensions
  videoPlayer.addEventListener('loadedmetadata', () => {
    // seek to user defined timestamp (in seconds) if possible
    if (videoPlayer.duration < seekTo) {
      getTempThumbnail(resolve, file.name);
      return;
    }
    // delay seeking or else 'seeked' event won't fire on Safari
    setTimeout(() => {
      videoPlayer.currentTime = seekTo;
    }, 200);
    // extract video thumbnail once seeking is complete
    videoPlayer.addEventListener('seeked', () => {
      // define a canvas to have the same dimension as the video
      const canvas = document.createElement('canvas');
      canvas.width = videoPlayer.videoWidth;
      canvas.height = canvas.width;
      // draw the video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
        // return the canvas image as a blob
        ctx.canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
              }));
            } else {
              getTempThumbnail(resolve, file.name);
            }
          },
          'image/jpeg',
          0.75, /* quality */
        );
      }
    });
  });
});
export { mediaUploader, getVideoCover };
