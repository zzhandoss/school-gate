import type { DeviceServiceIdentityWritePersonDto } from "@school-gate/contracts";

export function toIdentityWriteUserPerson(payload: DeviceServiceIdentityWritePersonDto) {
    return {
        userId: payload.userId,
        displayName: payload.displayName,
        ...(payload.userType !== undefined ? { userType: payload.userType } : {}),
        ...(payload.userStatus !== undefined ? { userStatus: payload.userStatus } : {}),
        ...(payload.authority !== undefined ? { authority: payload.authority } : {}),
        ...(payload.citizenIdNo !== undefined ? { citizenIdNo: payload.citizenIdNo } : {}),
        ...(payload.password !== undefined ? { password: payload.password } : {}),
        ...(payload.useTime !== undefined ? { useTime: payload.useTime } : {}),
        ...(payload.isFirstEnter !== undefined ? { isFirstEnter: payload.isFirstEnter } : {}),
        ...(payload.firstEnterDoors !== undefined
            ? { firstEnterDoors: payload.firstEnterDoors }
            : {}),
        ...(payload.doors !== undefined ? { doors: payload.doors } : {}),
        ...(payload.timeSections !== undefined ? { timeSections: payload.timeSections } : {}),
        ...(payload.specialDaysSchedule !== undefined
            ? { specialDaysSchedule: payload.specialDaysSchedule }
            : {}),
        ...(payload.validFrom !== undefined ? { validFrom: payload.validFrom } : {}),
        ...(payload.validTo !== undefined ? { validTo: payload.validTo } : {}),
        ...(payload.card
            ? {
                card: {
                    cardNo: payload.card.cardNo,
                    ...(payload.card.cardName !== undefined
                        ? { cardName: payload.card.cardName }
                        : {}),
                    ...(payload.card.cardType !== undefined
                        ? { cardType: payload.card.cardType }
                        : {}),
                    ...(payload.card.cardStatus !== undefined
                        ? { cardStatus: payload.card.cardStatus }
                        : {})
                }
            }
            : {}),
        ...(payload.face
            ? {
                face: {
                    ...(payload.face.photosBase64 !== undefined
                        ? { photosBase64: payload.face.photosBase64 }
                        : {}),
                    ...(payload.face.photoUrls !== undefined
                        ? { photoUrls: payload.face.photoUrls }
                        : {})
                }
            }
            : {})
    };
}
