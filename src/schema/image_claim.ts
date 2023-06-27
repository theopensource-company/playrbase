import { z } from 'zod';
import { record } from '../lib/zod.ts';

const image_claim = /* surrealql */ `
    DEFINE TABLE image_claim SCHEMAFULL
        PERMISSIONS
            FOR create WHERE $scope IN ['admin', 'manager', 'player'] AND count((SELECT by FROM image_claim WHERE by = $auth.id AND created + 30d > time::now())) < 30
            FOR select WHERE $scope = 'admin' OR by = $auth.id;

    DEFINE FIELD claim_token ON image_claim TYPE string VALUE meta::id(id);
    DEFINE FIELD by ON image_claim TYPE record<player | manager | admin> VALUE $before OR $auth.id;
    DEFINE FIELD target ON image_claim TYPE record<player | organisation>
        VALUE 
            IF $before THEN
                RETURN $before;
            ELSE IF ($scope = 'user') THEN  
                RETURN $auth.id;
            ELSE IF ($scope = 'manager') THEN 
                RETURN (SELECT VALUE id FROM organisation WHERE managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id)[0];
            ELSE IF ($scope = 'admin') THEN
                RETURN $input;
            ELSE 
                RETURN false;
            END;

    DEFINE FIELD type ON image_claim TYPE string 
        VALUE $before OR $value
        ASSERT 
            IF ($scope = 'player') THEN 
                RETURN $value IN ['profile_picture'];
            ELSE IF ($scope = 'manager') THEN
                RETURN $value IN ['banner', 'logo'];
            ELSE IF ($scope = 'admin') THEN
                RETURN $value IN ['profile_picture', 'banner', 'logo'];
            ELSE 
                RETURN false;
            END;

    DEFINE FIELD created ON image_claim TYPE datetime VALUE $before OR time::now();
`;

export const ImageClaim = z.object({
    id: record('image_claim'),
    claim_token: z.string(),
    by: z.union([record('admin'), record('manager'), record('player')]),
    target: z.union([record('player'), record('organisation')]),
    type: z.union([
        z.literal('profile_picture'),
        z.literal('banner'),
        z.literal('logo'),
    ]),

    created: z.coerce.date(),
});

export type ImageClaim = z.infer<typeof ImageClaim>;

export default image_claim;
