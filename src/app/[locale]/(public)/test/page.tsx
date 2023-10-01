'use client';

import React from 'react';

export default function test() {
    return (
        <form
            action="/api/cdn/s3_upload"
            method="post"
            encType="multipart/form-data"
        >
            Select image to upload:
            <input type="file" name="fileToUpload" id="fileToUpload" />
            <select name="type">
                <option value="profile_picture">Profile picture</option>
                <option value="banner">Banner</option>
                <option value="logo">Logo</option>
            </select>
            <input type="submit" value="Upload Image" name="submit" />
        </form>
    );
}
