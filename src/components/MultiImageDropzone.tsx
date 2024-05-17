'use client';

import {
	CheckCircleIcon,
	FileIcon,
	LucideFileWarning,
	Trash2Icon,
	UploadCloudIcon,
} from 'lucide-react';
import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

const variants = {
	base: 'relative h-full rounded-md p-4 w-96 max-w-[calc(100vw-1rem)] flex justify-center items-center flex-col cursor-pointer transition-colors duration-200 ease-in-out',
	active: 'shadow-lg shadow-[#031403]/20',
	disabled:
		'bg-gray-200 border-gray-300 cursor-default pointer-events-none bg-opacity-30 dark:bg-gray-700 dark:border-gray-600',
	accept: 'border border-blue-500 bg-blue-500 bg-opacity-10',
	reject: 'border border-red-700 bg-red-700 bg-opacity-10',
};

export type FileState = {
	file: File;
	key: string; // used to identify the file in the progress callback
	progress: 'PENDING' | 'COMPLETE' | 'ERROR' | number;
};

type InputProps = {
	className?: string;
	value?: FileState[];
	onChange?: (files: FileState[]) => void | Promise<void>;
	onFilesAdded?: (addedFiles: FileState[]) => void | Promise<void>;
	disabled?: boolean;
	dropzoneOptions?: Omit<DropzoneOptions, 'disabled'>;
};

const ERROR_MESSAGES = {
	fileTooLarge(maxSize: number) {
		return `The file is too large. Max size is ${formatFileSize(maxSize)}.`;
	},
	fileInvalidType() {
		return 'Invalid file type.';
	},
	tooManyFiles(maxFiles: number) {
		return `You can only add ${maxFiles} file(s).`;
	},
	fileNotSupported() {
		return 'The file is not supported.';
	},
};

const MultiFileDropzone = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{ dropzoneOptions, value, className, disabled, onFilesAdded, onChange },
		ref
	) => {
		const [customError, setCustomError] = React.useState<string>();
		if (dropzoneOptions?.maxFiles && value?.length) {
			disabled = disabled ?? value.length >= dropzoneOptions.maxFiles;
		}
		// dropzone configuration
		const {
			getRootProps,
			getInputProps,
			fileRejections,
			isFocused,
			isDragAccept,
			isDragReject,
		} = useDropzone({
			disabled,
			onDrop: (acceptedFiles) => {
				const files = acceptedFiles;
				setCustomError(undefined);
				if (
					dropzoneOptions?.maxFiles &&
					(value?.length ?? 0) + files.length > dropzoneOptions.maxFiles
				) {
					setCustomError(ERROR_MESSAGES.tooManyFiles(dropzoneOptions.maxFiles));
					return;
				}
				if (files) {
					const addedFiles = files.map<FileState>((file) => ({
						file,
						key: Math.random().toString(36).slice(2),
						progress: 'PENDING',
					}));
					void onFilesAdded?.(addedFiles);
					void onChange?.([...(value ?? []), ...addedFiles]);
				}
			},
			...dropzoneOptions,
		});

		// styling
		const dropZoneClassName = React.useMemo(
			() =>
				twMerge(
					variants.base,
					isFocused && variants.active,
					disabled && variants.disabled,
					(isDragReject ?? fileRejections[0]) && variants.reject,
					isDragAccept && variants.accept,
					className
				).trim(),
			[
				isFocused,
				fileRejections,
				isDragAccept,
				isDragReject,
				disabled,
				className,
			]
		);

		// error validation messages
		const errorMessage = React.useMemo(() => {
			if (fileRejections[0]) {
				const { errors } = fileRejections[0];
				if (errors[0]?.code === 'file-too-large') {
					return ERROR_MESSAGES.fileTooLarge(dropzoneOptions?.maxSize ?? 0);
				} else if (errors[0]?.code === 'file-invalid-type') {
					return ERROR_MESSAGES.fileInvalidType();
				} else if (errors[0]?.code === 'too-many-files') {
					return ERROR_MESSAGES.tooManyFiles(dropzoneOptions?.maxFiles ?? 0);
				} else {
					return ERROR_MESSAGES.fileNotSupported();
				}
			}
			return undefined;
		}, [fileRejections, dropzoneOptions]);

		return (
			<div className='w-full'>
				<div className='w-full h-screen grid items-center justify-center'>
					{/* text */}
					<div className=' flex flex-col md:flex-row border h-[30rem] border-[#E9FF92] shadow-lg shadow-[#E9FF92]/20 rounded-3xl p-4 relative overflow-hidden'>
						<div className=' absolute -left-[7rem] -top-[18rem] md:-top-[4rem] md:-left-[25%] w-[40rem] aspect-square rounded-full backg'></div>
						<div className='w-full h-full flex flex-col relative z-10 mt-10 mx-4 gap-20'>
							{/* heading */}
							<div className=''>
								<h1 className='text-[#031403] text-base sm:text-2xl font-semibold'>
									Upload Image
								</h1>
							</div>
							{/* Main File Input */}
							<div className='h-full grid items-center justify-center'>
								<div
									{...getRootProps({
										className: dropZoneClassName,
									})}>
									<input
										className=' outline-none'
										ref={ref}
										{...getInputProps()}
									/>
									<div className='flex flex-col items-center justify-center text-xs text-[#031403]'>
										<UploadCloudIcon className='mb-1 h-14 w-14' />
										<div className='text-[#031403] text-lg'>
											Drag & drop or click to upload
										</div>
									</div>
								</div>

								{/* Error Text */}
								<div className='mt-1 text-xs text-red-500'>
									{customError ?? errorMessage}
								</div>
							</div>
						</div>

						{/* Selected Files */}
						<div className='w-full relative z-10'>
							<div className='w-[20rem]'>
								<h1 className='text-[#E9FF92]/70 text-center mt-[2.5rem] underline font-semibold'>
									Image upload status
								</h1>
							</div>
							{value?.map(({ file, progress }, i) => (
								<div
									key={i}
									className='flex flex-col justify-center rounded px-4 py-2'>
									<div className='flex items-center gap-2 text-[#E9FF92]/70'>
										<FileIcon size='30' className='shrink-0' />
										<div className='min-w-0 text-sm'>
											<div className='overflow-hidden overflow-ellipsis whitespace-nowrap'>
												{file.name}
											</div>
											<div className='text-xs text-gray-400 text-[#E9FF92]/30'>
												{formatFileSize(file.size)}
											</div>
										</div>
										<div className='flex w-12 justify-end'>
											{progress === 'PENDING' ? (
												<button
													className='rounded-md p-1 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700'
													onClick={() => {
														void onChange?.(
															value.filter((_, index) => index !== i)
														);
													}}>
													<Trash2Icon className='shrink-0' />
												</button>
											) : progress === 'ERROR' ? (
												<LucideFileWarning
													size={20}
													className='shrink-0 text-red-600 dark:text-red-400'
												/>
											) : progress !== 'COMPLETE' ? (
												<div>{Math.round(progress)}%</div>
											) : (
												<CheckCircleIcon
													size={20}
													className='shrink-0 text-green-600 dark:text-green-600'
												/>
											)}
										</div>
									</div>
									{/* Progress Bar */}
									{typeof progress === 'number' && (
										<div className='relative h-0'>
											<div className='absolute top-1 h-1.5 w-full overflow-clip rounded-full bg-[#031403] border border-[#E9FF92]'>
												<div
													className='h-full bg-[#E9FF92] transition-all duration-300 ease-in-out'
													style={{
														width: progress ? `${progress}%` : '0%',
													}}
												/>
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}
);
MultiFileDropzone.displayName = 'MultiFileDropzone';

function formatFileSize(bytes?: number) {
	if (!bytes) {
		return '0 Bytes';
	}
	bytes = Number(bytes);
	if (bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const dm = 2;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export { MultiFileDropzone };
