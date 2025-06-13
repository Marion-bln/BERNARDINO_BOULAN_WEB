from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Any, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.books import Book as BookModel
from ...repositories.books import BookRepository
from ...services.books import BookService
from ..schemas.books import Book, BookCreate, BookUpdate, PagedBook
from ..dependencies import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/", response_model=PagedBook)
def read_books(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None,
    genre: Optional[str] = None,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Liste paginée, avec recherche libre (titre/auteur) et filtrage par genre.
    """
    query = db.query(BookModel)
    if q:
        term = f"%{q}%"
        query = query.filter(
            or_(BookModel.title.ilike(term), BookModel.author.ilike(term))
        )
    if genre:
        query = query.filter(BookModel.genre == genre)

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return PagedBook(
        items=items,
        total=total,
        page=(skip // limit) + 1,
        size=len(items),
        pages=(total + limit - 1) // limit,
    )


@router.get("/{id}", response_model=Book)
def read_book(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Détail d’un livre par son ID.
    """
    repository = BookRepository(BookModel, db)
    book = repository.get(id=id)
    if not book:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Livre non trouvé")
    return book


@router.post("/", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(
    *,
    db: Session = Depends(get_db),
    book_in: BookCreate,
    current_user=Depends(get_current_active_user),
) -> Any:
    """
    Crée un nouveau livre.
    """
    repo = BookRepository(BookModel, db)
    service = BookService(repo)
    try:
        return service.create(obj_in=book_in)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}", response_model=Book)
def update_book(
    *,
    db: Session = Depends(get_db),
    id: int,
    book_in: BookUpdate,
    current_user=Depends(get_current_admin_user),
) -> Any:
    """
    Met à jour un livre (admin).
    """
    repo = BookRepository(BookModel, db)
    service = BookService(repo)
    existing = service.get(id=id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Livre non trouvé")
    try:
        return service.update(db_obj=existing, obj_in=book_in)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{id}", response_model=Book)
def delete_book(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user=Depends(get_current_admin_user),
) -> Any:
    """
    Supprime un livre (admin).
    """
    repo = BookRepository(BookModel, db)
    service = BookService(repo)
    existing = service.get(id=id)
    if not existing:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Livre non trouvé")
    return service.remove(id=id)


# --- Recherches spécialisées (facultatif) ---

@router.get("/search/title/{title}", response_model=List[Book])
def search_by_title(
    *,
    db: Session = Depends(get_db),
    title: str,
    current_user=Depends(get_current_active_user),
) -> Any:
    repo = BookRepository(BookModel, db)
    return repo.get_by_title(title=title)


@router.get("/search/author/{author}", response_model=List[Book])
def search_by_author(
    *,
    db: Session = Depends(get_db),
    author: str,
    current_user=Depends(get_current_active_user),
) -> Any:
    repo = BookRepository(BookModel, db)
    return repo.get_by_author(author=author)


@router.get("/search/isbn/{isbn}", response_model=Book)
def search_by_isbn(
    *,
    db: Session = Depends(get_db),
    isbn: str,
    current_user=Depends(get_current_active_user),
) -> Any:
    repo = BookRepository(BookModel, db)
    book = repo.get_by_isbn(isbn=isbn)
    if not book:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Livre non trouvé")
    return book
