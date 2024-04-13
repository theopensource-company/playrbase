import { cn, promiseTimeout } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import React, { useId } from 'react';
import { DefaultValues, Path, useForm } from 'react-hook-form';
import { z } from 'zod';
import Editor from '../miscellaneous/Editor';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { FormField } from '../ui/form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export function EditorBox<T extends z.AnyZodObject = z.AnyZodObject>({
    title,
    description,
    placeholder,
    submit,
    defaultValue,
    defaultChecked,
    mutate,
    Schema,
    field,
    fieldType,
    fieldClassName,
}: {
    title: string;
    description: string;
    placeholder?: string;
    submit: string;
    defaultValue?: string;
    defaultChecked?: boolean;
    mutate: (payload: z.infer<T>) => Promise<unknown>;
    Schema: T;
    field: Path<z.TypeOf<T>>;
    fieldType?: 'input' | 'textarea' | 'richtext' | 'checkbox';
    fieldClassName?: string;
}) {
    const id = useId();
    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
        reset,
        control,
        setValue,
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
        defaultValues: {
            [field]: fieldType == 'checkbox' ? defaultChecked : defaultValue,
        } as DefaultValues<z.TypeOf<typeof Schema>>,
    });

    const handler = handleSubmit((payload) =>
        promiseTimeout(mutate(payload), 250).then(() => reset())
    );

    const errorMessage = errors?.[field]?.message;

    return (
        <form
            onSubmit={handler}
            className="flex w-full flex-col gap-6 rounded-lg border p-6"
        >
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{title}</h2>
                {fieldType !== 'checkbox' && <p>{description}</p>}
            </div>
            {!fieldType || fieldType == 'input' ? (
                <Input
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    {...register(field)}
                    className={cn('max-w-sm', fieldClassName)}
                    maxLength={Schema.shape[field].maxLength ?? undefined}
                />
            ) : fieldType == 'textarea' ? (
                <Textarea
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    {...register(field)}
                    className={cn('max-w-sm', fieldClassName)}
                    maxLength={Schema.shape[field].maxLength ?? undefined}
                    rows={8}
                />
            ) : fieldType == 'richtext' ? (
                <Editor
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    onChange={(v) => setValue(field, v as Schema[typeof field])}
                    maxLength={Schema.shape[field].maxLength ?? undefined}
                    className={fieldClassName}
                />
            ) : (
                <div className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={field}
                        render={({ field }) => (
                            <Checkbox
                                id={id}
                                defaultChecked={defaultChecked}
                                onCheckedChange={field.onChange}
                                className={fieldClassName}
                                {...field}
                            />
                        )}
                    />
                    <Label htmlFor={id}>{description}</Label>
                </div>
            )}
            <div className="flex items-center gap-4">
                <Button size="sm" disabled={!isValid || isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {submit}
                </Button>
                {errorMessage &&
                    typeof errorMessage == 'string' &&
                    !isSubmitSuccessful && (
                        <p className="text-red-600">{errorMessage}</p>
                    )}
            </div>
        </form>
    );
}

export function refetchWrapper<
    // eslint-disable-next-line
    T extends (...args: any[]) => Promise<unknown> = (
        // eslint-disable-next-line
        ...args: any[]
    ) => Promise<unknown>,
>({ mutateAsync, refetch }: { mutateAsync: T; refetch: () => unknown }) {
    return (...args: Parameters<T>) =>
        mutateAsync(...args).then((v) => {
            refetch();
            return v;
        });
}
