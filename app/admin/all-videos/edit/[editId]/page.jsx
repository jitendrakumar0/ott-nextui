"use client"
import React, { useEffect } from 'react';
import AdminLayout from '@/app/_layouts/AdminLayout';
import { CategoryIcon, CheckCircleIcon, EditIcon, Link2Icon, ResetIcon, ToggleIcon, TrendingIcon, UploadIcon } from '@/components/icons';
import { Button } from '@nextui-org/button';
import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { Select, SelectItem } from '@nextui-org/select';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db, storage } from '@/app/firebase/firebase';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import toast from 'react-hot-toast';
import { Snippet } from '@nextui-org/snippet';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/protected/ProtectedRoute';
import Link from 'next/link';
import { Avatar } from '@nextui-org/avatar';
import { ReturnCategoryID } from '@/utils/returnCategoryID';


const currentStatusOptions = [
	{ name: "Active", uid: "active" },
	{ name: "Paused", uid: "paused" },
];


const EditPage = ({ params }) => {
	const [statusGetData, setStatusGetData] = React.useState();
	const [categoryGetData, setCategoryGetData] = React.useState();

	const [title, setTitle] = React.useState("");
	const [url, setUrl] = React.useState("");
	const [category, setCategory] = React.useState();
	const [statuss, setStatuss] = React.useState();


	const [currentStatus, setCurrentStatus] = React.useState(currentStatusOptions[0].uid);
	const [isLoading, setIsLoading] = React.useState(false);
	const [imgUploading, setImgUploading] = React.useState(false);
	const [initialImageUrl, setInitialImageUrl] = React.useState(null);
	const [isImageOrVideo, setIsImageOrVideo] = React.useState('image');
	const [selectedFile, setSelectedFile] = React.useState(null);
	const [videoPreview, setVideoPreview] = React.useState(null);
	const inputFileRef = React.useRef(null);
	const router = useRouter();

	const fetchDataFromDB = async () => {
		try {
			const allMemesCollection = collection(db, "allmemes");
			const allMemesDocRef = doc(allMemesCollection, params.editId);
			const allMemesDocSnap = await getDoc(allMemesDocRef);
			const allMemesStatus = allMemesDocSnap.data();
			setTitle(allMemesStatus?.title);
			setUrl(allMemesStatus?.url);
			setCategory(allMemesStatus?.category);
			setStatuss(allMemesStatus?.statuss);
			setCurrentStatus(allMemesStatus?.status);
			setInitialImageUrl(allMemesStatus?.image);
			setVideoPreview(allMemesStatus?.video);
		} catch (error) {
			toast.error(error?.message);
		}
	}

	useEffect(() => {
		fetchDataFromDB()
	}, [params])

	useEffect(() => {
		initialImageUrl ? setIsImageOrVideo('image') : setIsImageOrVideo('video');
	}, [initialImageUrl])



	const fetchStatusData = async () => {
		try {
			const q = query(collection(db, "status"), where("status", "==", "active"));
			const querySnapshot = await getDocs(q);
			const statusData = [];
			querySnapshot.forEach((doc) => {
				statusData.push({ id: doc.id, ...doc.data() });
			})
			setStatusGetData(statusData);
		} catch (error) {
			toast.error(error)
		}
	}
	const fetchCategoryData = async () => {
		try {
			const q = query(collection(db, "category"), where("status", "==", "active"));
			const querySnapshot = await getDocs(q);
			const categoryData = [];
			querySnapshot.forEach((doc) => {
				categoryData.push({ id: doc.id, ...doc.data() });
			})
			setCategoryGetData(categoryData);
		} catch (error) {
			toast.error(error)
		}
	}
	useEffect(() => {
		fetchStatusData();
		fetchCategoryData();
	}, []);


	const submitHandler = async (e, downloadURL) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const allMemesCollection = collection(db, "allmemes");
			const allMemesDocRef = doc(allMemesCollection, params.editId);
			const body = {
				title: title,
				url: url,
				category: [...category],
				statuss: [...statuss],
				status: currentStatus,
				modifiedAt: serverTimestamp(),
				...(downloadURL ? {
					...(isImageOrVideo === 'image' ? { image: downloadURL } : { image: '' }),
					...(isImageOrVideo === 'video' ? { video: downloadURL } : { video: '' }),
				} : {}),
			}

			if (downloadURL) {
				const docSnapshot = await getDoc(allMemesDocRef);
				let mediaURL = '';
				docSnapshot.data()?.image ? mediaURL = docSnapshot.data()?.image : mediaURL = docSnapshot.data()?.video;
				const mediaRef = ref(storage, mediaURL);
				try {
					await deleteObject(mediaRef)
				} catch (error) {
					console.log(error)
				}
			}

			await updateDoc(allMemesDocRef, body);
			setSelectedFile(null); // Clear file selection after upload
			router.back()
			toast.success(`Video Updated with ID: ${params?.editId}`);
			setIsLoading(false);
		} catch (error) {
			console.log(error?.message);
			setIsLoading(false);
		}
	}

	const handleFileChange = (event) => {
		const file = event.target.files[0];
		// Check if the file is an image or video
		const allowedMimeTypesOfImages = ["image/jpeg", "image/webp", "image/avif", "image/png", "image/gif"];
		const allowedMimeTypesOfVideos = ["video/mp4", "video/quicktime", "video/wav", "video/avi"];
		if (allowedMimeTypesOfImages.includes(file?.type)) {
			setIsImageOrVideo('image')
			setSelectedFile(file);
		} else if (allowedMimeTypesOfVideos.includes(file?.type)) {
			setIsImageOrVideo('video')
			const reader = new FileReader();
			reader.onload = (e) => setVideoPreview(e.target.result);
			reader.readAsDataURL(file);
			setSelectedFile(file);
		} else {
			toast.error("Please select an image or video file.");
		}
	};

	const uploadFile = async (e, file) => {
		e.preventDefault();
		setImgUploading(true);
		setIsLoading(true);
		try {
			// Generate a unique filename based on current timestamp and original extension
			const timestamp = Date.now();
			const originalFilename = file.name;
			const extension = originalFilename.split('.').pop();
			const newFilename = `${timestamp}.${extension}`;

			const imagesRef = ref(storage, `/media/allmemes/${newFilename}`);
			await uploadBytes(imagesRef, file).then((snapshot) => {
				getDownloadURL(snapshot.ref)
					.then((downloadURL) => {
						submitHandler(e, downloadURL);
					})

			});
			// toast.success('File uploaded successfully!');
			setImgUploading(false);
		} catch (error) {
			toast.error(error?.message);
			setIsLoading(false);
		}
	};

	const handleUpload = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		if (selectedFile) {
			await uploadFile(e, selectedFile);
		} else {
			await submitHandler(e);

		}

	};


	return (
		<>
			<ProtectedRoute>
				<AdminLayout>
					<Card as={"form"} onSubmit={(e) => { handleUpload(e) }} className="w-full dark:bg-zinc-800 dark:text-white mx-auto has-[[aria-label=Loading]]:!pointer-events-none [&_label]:has-[[aria-label=Loading]]:!pointer-events-none">
						<CardHeader className="flex gap-3">
							<TrendingIcon className="size-6 text-primary dark:text-white" />
							<div className="flex flex-col">
								<p className="text-lg font-bold text-primary dark:text-white">Edit OTT Video</p>
								<div className='flex items-center gap-1'>ID: <Snippet className='py-0' symbol=" ">{params?.editId}</Snippet></div>
							</div>
						</CardHeader>
						<Divider />
						<CardBody className="dark:bg-zinc-900/50 grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-x-6 gap-y-3">
							<div className="mb-4 sm:col-span-2">
								<Input
									label="Video Title"
									isRequired
									size="lg"
									variant="bordered"
									startContent={<EditIcon className="size-4" />}
									type="text"
									id="title"
									value={title}
									onValueChange={setTitle}
								/>
							</div>
							<div className="mb-4">
								<Input
									label="Video URL(link)"
									isRequired
									size="lg"
									variant="bordered"
									startContent={<Link2Icon className="size-4" />}
									type="url"
									id="url"
									value={url}
									onValueChange={setUrl}
								/>
							</div>
							<div className="mb-4">
								<Select
									label="Select Category"
									disallowEmptySelection
									isRequired
									selectionMode="multiple"
									size="lg"
									variant="bordered"
									description={
										!categoryGetData?.length ? <div className='text-white'>Categories not found <Link className='text-primary font-bold' href={'/admin/categories/add'}>Add Category</Link></div> : ''
									}
									startContent={<CategoryIcon className="size-4" />}
									id="category"
									selectedKeys={category}
									onChange={(e) => { setCategory(new Set(e.target.value.split(","))) }}
								>
									{categoryGetData ? categoryGetData?.map((item) => (
										<SelectItem
											className="capitalize font-semibold"
											startContent={<Avatar alt={item?.categoryName} className="w-6 h-6" src={item?.image} />}
											key={item?.id + "%@%" + item?.categoryName}
											value={item?.id}
										>
											{item?.categoryName}
										</SelectItem>
									)) : ''}
								</Select>
							</div>
							<div className="mb-4">
								<Select
									label="Select Status"
									disallowEmptySelection
									isRequired
									selectionMode="multiple"
									size="lg"
									variant="bordered"
									description={
										!statusGetData?.length ? <div className='text-white'>Status not found <Link className='text-primary font-bold' href={'/admin/status/add'}>Add Category</Link></div> : ''
									}
									startContent={<TrendingIcon className="size-4" />}
									id="statuss"
									selectedKeys={statuss}
									onChange={(e) => { setStatuss(new Set(e.target.value.split(","))) }}
								>
									{statusGetData?.length ? statusGetData?.map((item) => (
										<SelectItem
											className="capitalize font-semibold"
											startContent={<Avatar alt={item?.statusName} className="w-6 h-6" src={item?.image} />}
											key={item?.id}
											value={item?.id}
										>
											{item?.statusName}
										</SelectItem>
									)) : ''}
								</Select>
							</div>
							<div className="mb-4">
								<Select
									label="Select Current Status"
									disallowEmptySelection
									isRequired
									size="lg"
									variant="bordered"
									startContent={<ToggleIcon className="size-4" />}
									id="currentStatus"
									selectedKeys={[currentStatus]}
									onChange={(e) => { setCurrentStatus(e.target.value) }}
								>
									{currentStatusOptions ? currentStatusOptions?.map((item) => (
										<SelectItem className="capitalize font-semibold" key={item?.uid} value={item?.uid}>
											{item?.name}
										</SelectItem>
									)) : ''}
								</Select>
							</div>
							<div className={`mb-4 sm:col-span-3 ${(videoPreview && isImageOrVideo == 'video') ? 'sm:!col-span-2' : ''}`}>
								<div className="flex items-center justify-center w-full">
									<label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 bg-cover bg-center"
										style={(isImageOrVideo == 'image' && selectedFile) ? { backgroundImage: `url(${URL.createObjectURL(selectedFile)})` } : (isImageOrVideo == 'image' && !selectedFile) ? { backgroundImage: `url(${initialImageUrl})` } : null}
									>

										<div className={`flex flex-col items-center justify-center pt-5 pb-6 backdrop-blur-lg size-full group/opacity hover:opacity-100 ${(isImageOrVideo == 'image') ? 'opacity-0 bg-zinc-900/50' : ''}`}>
											<UploadIcon className="size-6 text-zinc-500 group-[.opacity-0]/opacity:text-zinc-100 dark:text-zinc-400" />
											<p className="mb-2 text-sm text-zinc-500 group-[.opacity-0]/opacity:text-zinc-100 dark:text-zinc-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
											<p className="text-xs text-zinc-500 group-[.opacity-0]/opacity:text-zinc-100 dark:text-zinc-400">WEBP, AVIF, PNG, JPG or GIF (MAX. 800x400px)</p>
										</div>
										<input
											id="dropzone-file"
											name='file'
											type="file"
											className="hidden"
											onChange={handleFileChange}
											ref={inputFileRef}
											accept="image/*, video/*"
										/>
									</label>
								</div>
							</div>
							{(isImageOrVideo == 'video' && videoPreview) && (
								<div className='sm:!col-span-1'>
									<video src={videoPreview} controls className='w-full h-64 object-contain bg-zinc-200 dark:bg-zinc-950 rounded-lg' />
								</div>
							)}

						</CardBody>
						<Divider />
						<CardFooter>
							<div className="flex gap-4 items-center w-full">
								{
									!isLoading ?
										<Button type="submit" variant="solid" size="lg" className="!w-1/2 bg-purple-700 text-white font-semibold [&_svg]:has-[[aria-label=Loading]]:hidden [&_[aria-label=Loading]>*]:size-4" startContent={<CheckCircleIcon className="size-5" />}>
											Update
										</Button>
										:
										<Button type="button" variant="solid" isLoading size="lg" className="!w-1/2 bg-purple-700 text-white font-semibold [&_[aria-label=Loading]>*]:size-4">
											{!imgUploading ? "Saving..." : "Media Uploading..."}
										</Button>
								}
								<Button type="button" onClick={() => { router.back() }} size="lg" variant="bordered" className="!w-1/2 dark:border-zinc-200/30 font-semibold dark:text-white/70" startContent={<ResetIcon className="size-5" />}>
									Back
								</Button>
							</div>
						</CardFooter>
					</Card>
				</AdminLayout>
			</ProtectedRoute >
		</>
	)
}

export default EditPage