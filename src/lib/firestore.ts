// Import Firestore functions for interacting with the database
import { 
  collection, // Function to reference a Firestore collection
  query, // Function to create a Firestore query
  orderBy, // Function to sort query results
  limit, // Function to limit the number of query results
  addDoc, // Function to add a new document to a collection
  deleteDoc, // Function to delete a document
  doc, // Function to reference a specific Firestore document
  getDocs, // Function to fetch documents from a query or collection
} from 'firebase/firestore';
import { db } from './firebase'; // Import the Firestore database instance configured in firebase.js
import { HistoricalAnalysis } from '@/utils/types'; // Type definition for historical analysis data

// Save a new analysis to the user's history in Firestore
export const saveAnalysis = async (userId: string, analysis: HistoricalAnalysis) => {
  try {
    // Reference the user's history subcollection in Firestore
    const userHistoryRef = collection(db, 'users', userId, 'history');
    // Add a new document to the history subcollection with the analysis data
    // Include the userId and a timestamp for sorting
    await addDoc(userHistoryRef, {
      ...analysis,
      userId,
      timestamp: new Date().toISOString() // Store the current timestamp in ISO format
    });
  } catch (error) {
    // Log the error and rethrow it for the caller to handle
    console.error('Error saving analysis:', error);
    throw error;
  }
};

// Fetch the user's recent analysis history from Firestore
export const getAnalysisHistory = async (userId: string): Promise<HistoricalAnalysis[]> => {
  try {
    // Reference the user's history subcollection in Firestore
    const userHistoryRef = collection(db, 'users', userId, 'history');
    // Create a query to fetch the 10 most recent history entries, sorted by timestamp in descending order
    const q = query(
      userHistoryRef,
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    // Execute the query and get the resulting documents
    const snapshot = await getDocs(q);
    // Map the documents to HistoricalAnalysis objects, including the document ID
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HistoricalAnalysis));
  } catch (error) {
    // Log the error and rethrow it for the caller to handle
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

// Delete a specific analysis from the user's history in Firestore
export const deleteAnalysis = async (userId: string, analysisId: string) => {
  try {
    // Reference the specific analysis document in the user's history subcollection
    const analysisRef = doc(db, 'users', userId, 'history', analysisId);
    // Delete the document from Firestore
    await deleteDoc(analysisRef);
  } catch (error) {
    // Log the error and rethrow it for the caller to handle
    console.error('Error deleting analysis:', error);
    throw error;
  }
};