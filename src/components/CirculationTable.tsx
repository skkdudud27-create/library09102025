import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { Book, Member } from "@shared/schema";

export default function CirculationTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"available" | "issued" | "overdue">("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: issuedBooks = [] } = useQuery<{ book: Book; member: Member; dueDate: Date | null }[]>({
    queryKey: ["/api/analytics/issued-books"],
  });

  const availableBooks = books.filter(book => book.status === "available");
  const overdueBooks = issuedBooks.filter(item => 
    item.dueDate && new Date(item.dueDate) < new Date()
  );

  const issueBook = useMutation({
    mutationFn: async ({ bookId, memberId }: { bookId: number; memberId: number }) => {
      const circulationData = {
        bookId,
        memberId,
        action: "borrow",
      };
      
      // Create circulation record first
      const circulationResponse = await apiRequest("POST", "/api/circulation", circulationData);
      const circulationRecord = await circulationResponse.json();
      
      // Set due date to 14 days from now and update the record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      await apiRequest("PUT", `/api/circulation/${circulationRecord.id}`, { 
        dueDate: dueDate.toISOString() 
      });
      
      // Update book status to issued
      await apiRequest("PUT", `/api/books/${bookId}`, { status: "issued" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/issued-books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circulation"] });
      toast({
        title: "Success",
        description: "Book issued successfully!",
      });
      setShowIssueModal(false);
      setSelectedBook(null);
      setSelectedMemberId("");
      setMemberSearchQuery("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to issue book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const returnBook = useMutation({
    mutationFn: async ({ bookId }: { bookId: number }) => {
      // Find the active borrow record for this book
      const activeRecordsResponse = await apiRequest("GET", "/api/circulation/active");
      const activeRecords = await activeRecordsResponse.json();
      const activeBorrowRecord = activeRecords.find((record: any) => 
        record.bookId === bookId && record.action === "borrow"
      );
      
      if (activeBorrowRecord) {
        // Update the active borrow record to "returned" status and add return date
        await apiRequest("PUT", `/api/circulation/${activeBorrowRecord.id}`, { 
          status: "returned",
          returnDate: new Date().toISOString()
        });
        
        // Create return circulation record for history
        const circulationData = {
          bookId,
          memberId: activeBorrowRecord.memberId,
          action: "return",
        };
        
        const returnResponse = await apiRequest("POST", "/api/circulation", circulationData);
        const returnRecord = await returnResponse.json();
        
        // Update the return record to "returned" status immediately
        await apiRequest("PUT", `/api/circulation/${returnRecord.id}`, { 
          status: "returned",
          returnDate: new Date().toISOString()
        });
      }
      
      // Update book status to available
      await apiRequest("PUT", `/api/books/${bookId}`, { status: "available" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/issued-books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circulation"] });
      toast({
        title: "Success",
        description: "Book returned successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to return book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleIssueBook = (book: Book) => {
    setSelectedBook(book);
    setShowIssueModal(true);
  };

  const handleConfirmIssue = () => {
    if (selectedBook && selectedMemberId) {
      issueBook.mutate({
        bookId: selectedBook.id,
        memberId: parseInt(selectedMemberId),
      });
    }
  };

  const handleReturnBook = (bookId: number) => {
    returnBook.mutate({ bookId });
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "available":
        return availableBooks.length;
      case "issued":
        return issuedBooks.length;
      case "overdue":
        return overdueBooks.length;
      default:
        return 0;
    }
  };

  const getDisplayData = () => {
    switch (activeTab) {
      case "available":
        return availableBooks.filter(book => 
          searchQuery === "" || 
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "issued":
        return issuedBooks.filter(item => 
          searchQuery === "" || 
          item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.member.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case "overdue":
        return overdueBooks.filter(item => 
          searchQuery === "" || 
          item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.member.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  };

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Borrow & Return Books</h2>
      </div>
      
      <CardContent className="p-6">
        {/* Status Tabs */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === "available" ? "default" : "outline"}
            onClick={() => setActiveTab("available")}
            className="text-sm"
          >
            Available ({getTabCount("available")})
          </Button>
          <Button
            variant={activeTab === "issued" ? "default" : "outline"}
            onClick={() => setActiveTab("issued")}
            className="text-sm"
          >
            Issued ({getTabCount("issued")})
          </Button>
          <Button
            variant={activeTab === "overdue" ? "default" : "outline"}
            onClick={() => setActiveTab("overdue")}
            className="text-sm"
          >
            Overdue ({getTabCount("overdue")})
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by title, author, or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "available" && (
            <>
              {getDisplayData().length > 0 ? (
                <div className="grid gap-4">
                  {(getDisplayData() as Book[]).map((book) => (
                    <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{book.title}</h3>
                        <p className="text-sm text-gray-600">{book.author}</p>
                        <p className="text-xs text-gray-500">{book.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleIssueBook(book)}
                          disabled={issueBook.isPending}
                        >
                          Issue Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📚</div>
                  <p className="text-gray-600">No available books match your criteria.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "issued" && (
            <>
              {getDisplayData().length > 0 ? (
                <div className="grid gap-4">
                  {(getDisplayData() as { book: Book; member: Member; dueDate: Date | null }[]).map((item, index) => (
                    <div key={`issued-${item.book.id}-${item.member.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.book.title}</h3>
                        <p className="text-sm text-gray-600">{item.book.author}</p>
                        <p className="text-xs text-gray-500">Borrowed by {item.member.fullName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-red-100 text-red-800 font-bold">⚡ ISSUED</Badge>
                        {item.dueDate && (
                          <Badge variant="outline">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReturnBook(item.book.id)}
                          disabled={returnBook.isPending}
                        >
                          Return Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📖</div>
                  <p className="text-gray-600">No issued books match your criteria.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "overdue" && (
            <>
              {getDisplayData().length > 0 ? (
                <div className="grid gap-4">
                  {(getDisplayData() as { book: Book; member: Member; dueDate: Date | null }[]).map((item, index) => (
                    <div key={`overdue-${item.book.id}-${item.member.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.book.title}</h3>
                        <p className="text-sm text-gray-600">{item.book.author}</p>
                        <p className="text-xs text-gray-500">Borrowed by {item.member.fullName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-red-500 text-white font-bold animate-pulse">🚨 OVERDUE</Badge>
                        {item.dueDate && (
                          <Badge variant="destructive">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReturnBook(item.book.id)}
                          disabled={returnBook.isPending}
                        >
                          Return Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">✅</div>
                  <p className="text-gray-600">No overdue books found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      {/* Issue Book Modal */}
      <Dialog open={showIssueModal} onOpenChange={setShowIssueModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
          </DialogHeader>
          
          {selectedBook && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedBook.title}</h3>
                <p className="text-sm text-gray-600">{selectedBook.author}</p>
                <p className="text-xs text-gray-500">{selectedBook.category}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, class, or registration number..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter(member => 
                          memberSearchQuery === "" || 
                          member.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          member.class.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          member.registrationNo.toLowerCase().includes(memberSearchQuery.toLowerCase())
                        )
                        .map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.fullName} - {member.class} ({member.registrationNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Due date will be set to 14 days from today
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowIssueModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmIssue}
                  disabled={!selectedMemberId || issueBook.isPending}
                >
                  {issueBook.isPending ? "Issuing..." : "Issue Book"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
