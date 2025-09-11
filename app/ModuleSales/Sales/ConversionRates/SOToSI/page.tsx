"use client";
import React, { useState, useEffect } from "react";
import ParentLayout from "../../../components/Layouts/ParentLayout";
import SessionChecker from "../../../components/Session/SessionChecker";
import UserFetcher from "../../../components/User/UserFetcher";

// Components
import AddPostForm from "../../../components/ClientActivityBoard/ListofCompanies/AddUserForm";
import SearchFilters from "../../../components/ConversionRates/CallsToQuote/SearchFilters";
import UsersTable from "../../../components/ConversionRates/SOToSI/UsersTable";

// Toast Notifications
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const ListofUser: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClientType, setSelectedClientType] = useState("");
    const [startDate, setStartDate] = useState(""); // Default to null
    const [endDate, setEndDate] = useState(""); // Default to null

    const [userDetails, setUserDetails] = useState({
        UserId: "", ReferenceID: "", Firstname: "", Lastname: "", Email: "", Role: "", Department: "", Company: "",
    });
    const [usersList, setUsersList] = useState<any[]>([]);

    // Loading states
    const [error, setError] = useState<string | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);
    const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);

    const loading = loadingUser || loadingAccounts; // 🔑 combined state

    // Fetch user data based on query parameters (user ID)
    useEffect(() => {
        const fetchUserData = async () => {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get("id");

            if (userId) {
                try {
                    const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
                    if (!response.ok) throw new Error("Failed to fetch user data");
                    const data = await response.json();
                    setUserDetails({
                        UserId: data._id, // Set the user's id here
                        ReferenceID: data.ReferenceID || "",
                        Firstname: data.Firstname || "",
                        Lastname: data.Lastname || "",
                        Email: data.Email || "",
                        Role: data.Role || "",
                        Department: data.Department || "",
                        Company: data.Company || "",
                    });
                } catch (err: unknown) {
                    console.error("Error fetching user data:", err);
                    setError("Failed to load user data. Please try again later.");
                } finally {
                    setLoadingUser(false);
                }
            } else {
                setError("User ID is missing.");
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch users from MongoDB or PostgreSQL
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("/api/getUsers"); // API endpoint mo
                const data = await response.json();
                setUsersList(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    // Fetch all users from the API
    const fetchAccount = async () => {
        setLoadingAccounts(true);
        try {
            const response = await fetch("/api/ModuleSales/ConversionRate/FetchSOSI");
            const data = await response.json();
            setPosts(data.data);
        } catch (error) {
            toast.error("Error fetching users.");
            console.error("Error Fetching", error);
        } finally {
            setLoadingAccounts(false);
        }
    };

    useEffect(() => {
        fetchAccount();
    }, []);

    // Filter users by search term (firstname, lastname)
    const filteredAccounts = Array.isArray(posts)
        ? posts
            .filter((post) => {
                const agent = usersList.find((user) => user.ReferenceID === post.referenceid);
                const agentFirstname = agent ? agent.Firstname.toLowerCase() : "";
                const agentLastname = agent ? agent.Lastname.toLowerCase() : "";
                const searchLower = searchTerm.toLowerCase();

                const matchesSearchTerm =
                    agentFirstname.includes(searchLower) || agentLastname.includes(searchLower);

                const postDate = post.date_created ? new Date(post.date_created) : null;
                const isWithinDateRange =
                    (!startDate || (postDate && postDate >= new Date(startDate))) &&
                    (!endDate || (postDate && postDate <= new Date(endDate)));

                const matchesClientType = selectedClientType
                    ? post?.typeclient === selectedClientType
                    : true;

                const referenceID = userDetails.ReferenceID;

                const matchesRole =
                    userDetails.Role === "Super Admin" || userDetails.Role === "Special Access"
                        ? true
                        : userDetails.Role === "Manager"
                            ? post?.manager === referenceID
                            : userDetails.Role === "Territory Sales Manager"
                                ? post?.tsm === referenceID
                                : userDetails.Role === "Territory Sales Associate"
                                    ? post?.referenceid === referenceID
                                    : false;

                return matchesSearchTerm && isWithinDateRange && matchesClientType && matchesRole;
            })
            .map((post) => {
                const agent = usersList.find((user) => user.ReferenceID === post.referenceid);

                return {
                    ...post,
                    AgentFirstname: agent ? agent.Firstname : "Unknown",
                    AgentLastname: agent ? agent.Lastname : "Unknown",
                };
            })
            .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()) // Sorting by date_created
        : [];

    // Handle editing a post
    const handleEdit = (post: any) => {
        setEditUser(post);
        setShowForm(true);
    };

    return (
        <SessionChecker>
            <ParentLayout>
                <UserFetcher>
                    {(user) => (
                        <div className="mx-auto p-4 text-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                                {showForm ? (
                                    <AddPostForm
                                        onCancel={() => {
                                            setShowForm(false);
                                            setEditUser(null);
                                        }}
                                        refreshPosts={fetchAccount}  // Pass the refreshPosts callback
                                        userDetails={{ id: editUser ? editUser.id : userDetails.UserId }}  // Ensure id is passed correctly
                                        editUser={editUser}
                                    />
                                ) : (
                                    <>
                                        <div className="mb-4 p-4 bg-white shadow-md rounded-lg">
                                            <h2 className="text-lg font-bold mb-2">SO To SI</h2>
                                            <p className="text-xs text-gray-600 mb-2">
                                                This section offers a comprehensive overview of each agent's sales performance, tracking both Month-to-Date (MTD) and Year-to-Date (YTD) sales. It highlights the agent’s progress in meeting sales targets and provides a detailed evaluation of their overall performance, including achievements and sales ratings.
                                            </p>

                                            <SearchFilters
                                                searchTerm={searchTerm}
                                                setSearchTerm={setSearchTerm}
                                            />
                                            {/* Loader or Table */}
                                            {loading ? (
                                                <div className="flex justify-center items-center py-10">
                                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                                                    <span className="ml-2 text-xs text-gray-500">Loading data...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <UsersTable
                                                        posts={filteredAccounts}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}

                                <ToastContainer className="text-xs" autoClose={1000} />
                            </div>
                        </div>
                    )}
                </UserFetcher>
            </ParentLayout>
        </SessionChecker>
    );
};

export default ListofUser;
