import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { MouseEvent, useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, {
    Crop,
    PercentCrop,
    centerCrop,
    makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    DD,
    DDContent,
    DDDescription,
    DDFooter,
    DDHeader,
    DDTitle,
    DDTrigger,
} from '../ui-custom/dd';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export default function UploadImage({
    intent,
    title,
    description,
}: {
    intent: 'profile_picture';
    title: string;
    description: string;
}) {
    const [uploaded, setUploaded] = useState<File | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState(false);
    const { loading, user, refreshUser } = useAuth();
    const t = useTranslations('components.logic.upload-image');

    // FIXME: Nasty workaround to force react-image-crop to reexecute the "onComplete" function by unrendering and rerendering the whole component.
    // This is needed because otherwise the output will not update when selecting a new picture.
    const [refresh, setRefresh] = useState(true);
    useEffect(() => {
        if (!refresh) setRefresh(true);
    }, [refresh, setRefresh]);

    const onDrop = useCallback((files: File[]) => {
        setUploaded(files && files[0]);
        setRefresh(false);
    }, []);

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
    });

    const saveImage = async () => {
        if (!blob) {
            alert(t('error.no-image'));
            return;
        }

        (async (): Promise<true | void> => {
            setIsLoading(true);

            const data = new FormData();
            data.append('file', blob, 'profilepicture.png');
            data.append('intent', intent);

            const res = await fetch('/api/picture', {
                method: 'PUT',
                body: data,
            }).then((res) => res.json());

            if (res.success) {
                return true;
            } else {
                alert(`${t('error.server')}: ${res.error}`);
            }
        })().then((success) => {
            setIsLoading(false);

            if (success) {
                setIsOpen(false);
                refreshUser();
                setTimeout(() => {
                    setBlob(null);
                    setUploaded(null);
                }, 250);
            }
        });
    };

    const removePicture = async (e: MouseEvent) => {
        e.preventDefault();
        setIsLoading(true);

        await fetch('/api/picture', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent,
            }),
        });

        setIsOpen(false);
        refreshUser();

        setTimeout(() => {
            setBlob(null);
            setUploaded(null);
            setIsLoading(false);
        }, 250);
    };

    useEffect(() => {
        if (!isOpen && !isLoading) {
            setUploaded(null);
            setBlob(null);
        }
    }, [isOpen, isLoading, setUploaded, setBlob]);

    return (
        <div {...getRootProps()}>
            <DD open={isOpen} onOpenChange={setIsOpen}>
                <DDTrigger asChild>
                    {loading ? (
                        <Skeleton className="h-10 w-20" />
                    ) : (
                        <Button>{t('trigger')}</Button>
                    )}
                </DDTrigger>
                <DDContent>
                    <DDHeader>
                        <DDTitle>{title}</DDTitle>
                        <DDDescription>{description}</DDDescription>
                    </DDHeader>
                    <input {...getInputProps()} />
                    <div className="relative mb-1 mt-6">
                        {!uploaded ? (
                            <div
                                onClick={open}
                                className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground border-white"
                            >
                                <p className="text-muted-foreground">
                                    {t('empty.drop')}
                                </p>
                            </div>
                        ) : (
                            <div className="flex w-full items-center justify-center">
                                {refresh && (
                                    <CropProfilePicture
                                        file={uploaded}
                                        setBlob={setBlob}
                                    />
                                )}
                            </div>
                        )}
                        <div
                            className={cn(
                                'absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-lg bg-primary-foreground transition-opacity',
                                isLoading
                                    ? 'opacity-[85%]'
                                    : 'pointer-events-none opacity-0'
                            )}
                        >
                            <Loader2
                                size={200}
                                className="w-[10%] min-w-[45px] animate-spin"
                            />
                        </div>
                    </div>

                    {((user && intent in user) || uploaded) && (
                        <DDFooter>
                            {user && intent in user && (
                                <Button
                                    onClick={removePicture}
                                    disabled={isLoading}
                                    variant="destructive"
                                >
                                    {t('dialog.remove')}
                                </Button>
                            )}
                            {uploaded && (
                                <>
                                    <Button onClick={open} disabled={isLoading}>
                                        {t('dialog.change')}
                                    </Button>
                                    <Button
                                        onClick={saveImage}
                                        disabled={isLoading}
                                    >
                                        {t('dialog.save')}
                                    </Button>
                                </>
                            )}
                        </DDFooter>
                    )}
                </DDContent>
            </DD>
        </div>
    );
}

export function CropProfilePicture({
    file,
    setBlob,
}: {
    file: File;
    setBlob: (blob: Blob) => void;
}) {
    const t = useTranslations('components.logic.upload-image.cropper');
    const [crop, setCrop] = useState<Crop>();
    const [size, setSize] = useState<{
        width: number;
        height: number;
    }>({
        width: 0,
        height: 0,
    });

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.addEventListener('load', function () {
        if (size.width !== this.width && size.height !== this.height) {
            setSize(this);
            setCrop(centerAspectCrop(this.width, this.height, 1));
        }
    });

    img.src = url;
    img.alt = t('img-alt');

    return (
        <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={1}
            onComplete={async (_, percentage) => {
                setBlob(await getCroppedImg(img, percentage));
            }}
            circularCrop={true}
            keepSelection={true}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={t('img-alt')} className="rounded-lg" />
        </ReactCrop>
    );
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 100,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

async function getCroppedImg(input: HTMLImageElement, crop: PercentCrop) {
    const image = new Image();
    return new Promise<Blob>((resolve) => {
        image.addEventListener('load', () => {
            crop.x = (image.width / 100) * crop.x;
            crop.y = (image.height / 100) * crop.y;
            crop.width = (image.width / 100) * crop.width;
            crop.height = (image.height / 100) * crop.height;

            const canvas = document.createElement('canvas');
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext('2d');

            ctx?.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            );

            // Credit where due: https://stackoverflow.com/a/5100158
            const dataURI = canvas.toDataURL();
            let byteString;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                byteString = atob(dataURI.split(',')[1]);
            else byteString = unescape(dataURI.split(',')[1]);

            // separate out the mime component
            const mimeString = dataURI
                .split(',')[0]
                .split(':')[1]
                .split(';')[0];

            // write the bytes of the string to a typed array
            const ia = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            resolve(new Blob([ia], { type: mimeString }));
        });

        image.src = input.src;
    });
}
