import os
import uuid
import subprocess
import chardet
import json
from typing import Dict, List, Tuple, Optional
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi
from langchain_community.document_loaders import DirectoryLoader, NotebookLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from utils import clean_and_tokenize

def detect_encoding(file_path: str) -> str:
    """Detect the file encoding using chardet with fallback options."""
    try:
        with open(file_path, 'rb') as file:
            raw_data = file.read()
            result = chardet.detect(raw_data)
            confidence = result.get('confidence', 0)
            
            # Only trust chardet if confidence is high
            if confidence > 0.8:
                return result['encoding']
            
            # Try common encodings
            encodings = ['utf-8', 'cp1252', 'iso-8859-1', 'ascii']
            for encoding in encodings:
                try:
                    raw_data.decode(encoding)
                    return encoding
                except UnicodeDecodeError:
                    continue
            
            return 'utf-8'  # Default fallback
    except Exception:
        return 'utf-8'

def safe_load_text(file_path: str) -> Optional[str]:
    """Safely load text content with multiple encoding attempts."""
    fallback_encodings = ['utf-8', 'cp1252', 'iso-8859-1', 'ascii', 'utf-16']
    
    # First try detected encoding
    detected_encoding = detect_encoding(file_path)
    try:
        with open(file_path, 'r', encoding=detected_encoding) as f:
            return f.read()
    except UnicodeDecodeError:
        # Try fallback encodings
        for encoding in fallback_encodings:
            if encoding != detected_encoding:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        return f.read()
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    print(f"Error reading file {file_path} with {encoding}: {str(e)}")
                    continue
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
    
    # If all attempts fail, try binary read and decode
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            return content.decode('utf-8', errors='replace')
    except Exception as e:
        print(f"Final attempt failed for {file_path}: {str(e)}")
        return None

def clone_github_repo(github_url: str, local_path: str) -> bool:
    """Clone a GitHub repository with improved error handling."""
    try:
        # Create directory if it doesn't exist
        os.makedirs(local_path, exist_ok=True)
        
        # Set Git config to handle line endings
        subprocess.run(['git', 'config', '--global', 'core.autocrlf', 'input'])
        
        # Clone with specific options
        result = subprocess.run(
            ['git', 'clone', '--depth', '1', github_url, local_path],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git clone failed: {e.stderr}")
        return False
    except Exception as e:
        print(f"Repository cloning failed: {str(e)}")
        return False

def safe_load_json(file_path: str) -> Optional[Document]:
    """Safely load and parse JSON files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
            return Document(
                page_content=json.dumps(content, indent=2),
                metadata={'source': file_path}
            )
    except json.JSONDecodeError:
        print(f"Invalid JSON in file: {file_path}")
        return None
    except Exception as e:
        print(f"Error processing JSON file {file_path}: {str(e)}")
        return None

def load_and_index_files(repo_path: str) -> Tuple[Optional[BM25Okapi], List[Document], Dict[str, int], List[str]]:
    """Load and index repository files with improved error handling."""
    extensions = {
        'text': ['txt', 'md', 'markdown'],
        'code': ['py', 'js', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php', 'scala'],
        'web': ['html', 'htm', 'css', 'scss'],
        'notebook': ['ipynb']
    }

    file_type_counts = {}
    documents_dict = {}
    repo_path = Path(repo_path)

    # Process files by category
    for category, exts in extensions.items():
        for ext in exts:
            try:
                if category == 'notebook':
                    # Handle notebooks separately
                    notebook_paths = list(repo_path.rglob(f"*.{ext}"))
                    for nb_path in notebook_paths:
                        try:
                            loader = NotebookLoader(
                                str(nb_path),
                                include_outputs=True,
                                max_output_length=20,
                                remove_newline=True
                            )
                            docs = loader.load()
                            if docs:
                                file_type_counts[ext] = file_type_counts.get(ext, 0) + len(docs)
                                for doc in docs:
                                    file_id = str(uuid.uuid4())
                                    doc.metadata['file_id'] = file_id
                                    doc.metadata['source'] = str(nb_path.relative_to(repo_path))
                                    documents_dict[file_id] = doc
                        except PermissionError:
                            print(f"Permission denied for notebook: {nb_path}")
                            continue
                        except Exception as e:
                            print(f"Error processing notebook {nb_path}: {str(e)}")
                            continue
                else:
                    # Handle other file types
                    for file_path in repo_path.rglob(f"*.{ext}"):
                        try:
                            if category == 'data':
                                doc = safe_load_json(str(file_path))
                            else:
                                content = safe_load_text(str(file_path))
                                if content is not None:
                                    doc = Document(
                                        page_content=content,
                                        metadata={'source': str(file_path.relative_to(repo_path))}
                                    )
                                else:
                                    continue

                            if doc:
                                file_type_counts[ext] = file_type_counts.get(ext, 0) + 1
                                file_id = str(uuid.uuid4())
                                doc.metadata['file_id'] = file_id
                                documents_dict[file_id] = doc
                        except Exception as e:
                            print(f"Error processing file {file_path}: {str(e)}")
                            continue

            except Exception as e:
                print(f"Error processing {category} files with extension .{ext}: {str(e)}")
                continue

    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    split_documents = []
    
    for file_id, original_doc in documents_dict.items():
        try:
            split_docs = text_splitter.split_documents([original_doc])
            for split_doc in split_docs:
                split_doc.metadata['file_id'] = original_doc.metadata['file_id']
                split_doc.metadata['source'] = original_doc.metadata['source']
            split_documents.extend(split_docs)
        except Exception as e:
            print(f"Error splitting document {original_doc.metadata['source']}: {str(e)}")
            continue

    # Create index
    index = None
    if split_documents:
        try:
            tokenized_documents = [clean_and_tokenize(doc.page_content) for doc in split_documents]
            index = BM25Okapi(tokenized_documents)
        except Exception as e:
            print(f"Error creating search index: {str(e)}")

    return (
        index,
        split_documents,
        file_type_counts,
        [doc.metadata['source'] for doc in split_documents]
    )