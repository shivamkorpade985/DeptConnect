package com.DeptConnect.service;

import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.payload.dto.DocumentDto;
import com.DeptConnect.payload.request.DocumentRequest;
import com.DeptConnect.payload.response.PageResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService{

    DocumentDto uploadDocument(String currentUserEmail, MultipartFile file, DocumentRequest req) throws UserException;


    DocumentDto editDocument(Long id, String currentUserEmail, MultipartFile file, DocumentRequest req) throws UserException, AccessDeniedException;

    void deleteDocument(Long id, String currentUserEmail) throws UserException, AccessDeniedException;

    DocumentDto getDocument(Long id);

    List<DocumentDto> getAllDocuments();


    public DocumentDto getDocumentForUser(Long id, Authentication auth) throws AccessDeniedException, ResourceNotFoundException, UserException;
    PageResponse<DocumentDto> getDocumentsForUser(
            Authentication auth,
            String category,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) throws UserException;;
}
